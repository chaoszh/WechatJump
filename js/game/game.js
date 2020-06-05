const THREE = require('three')
import { ModelConfig } from './modelConfig'
import { Tween } from '../lib/Tween'
import { OBJLoader, MTLLoader } from 'three-obj-mtl-loader'
function Game() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera(
        window.innerWidth / -60,
        window.innerWidth / 60,
        window.innerHeight / 60,
        window.innerHeight / -60,
        0.1, 5000);
    this.camera.position.set(100, 100, 100);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0))
    this.cameraPos = {
        current: new THREE.Vector3(0, 0, 0), // 摄像机当前的坐标
        next: new THREE.Vector3() // 摄像机即将要移到的位置
    };
    this.cameraSpeed = {
        x: 0,
        y: 0,
        z: 0
    }
    this.CAMERA_MOVE_TIME = 40;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.antialias = true;
    document.body.appendChild(this.renderer.domElement);
    this.canvas = this.renderer.domElement;

    // 灯光
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(2, 5, -2);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0; //产生阴影的最近距离
    directionalLight.shadow.camera.far = 100; //产生阴影的最远距离
    let d = 15;
    directionalLight.shadow.camera.left = -d; //产生阴影距离位置的最左边位置
    directionalLight.shadow.camera.right = d; //最右边
    directionalLight.shadow.camera.top = d; //最上边
    directionalLight.shadow.camera.bottom = -d; //最下面
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    this.config = {
        // 弹跳体参数设置
        jumpTopRadius: 0.3,
        jumpBottomRadius: 0.5,
        jumpHeight: 2,
        jumpColor: 0xffffff,
        // 立方体参数设置
        cubeX: 4,
        cubeY: 2,
        cubeZ: 4,
        cubeColor: 0x00ffff,
        // 圆柱体参数设置
        cylinderRadius: 2,
        cylinderHeight: 2,
        cylinderColor: 0x00ff00,
        // 设置缓存数组最大缓存多少个图形
        cubeMaxLen: 6,
        // 立方体内边缘之间的最小距离和最大距离
        cubeMinDis: 2,
        cubeMaxDis: 5,

        // 模型Config
        modelConfig:  ModelConfig.prototype,
    };

    this.mouse = {
        down: this.isPC() ? 'mousedown' : 'touchstart',
        up: this.isPC() ? 'mouseup' : 'touchend'
    };

    this.cubes = [];
    this.models = [];
    window.models=this.models;
    this.jumper = null;

    // mousedown : -1
    // mouseup : 1
    this.JUMP_FRAME_NUM = 40;
    this.ADDSPEED = 0.005;
    this.accelerate = {
        x: 0,       //水平匀速运动
        y: 0.02,   //固定值
        z: 0        //水平匀速运动
    }
    this.speed = {
        x: 0,       //向前进方向的速度 随着mousedown时间增加
        y: this.accelerate.y * this.JUMP_FRAME_NUM / 2,    //弹起的速度 固定值
        z: 0        //补偿速度 使jumper落在下一方块的中心轴上
    };
    this.mouseState = 0;
    this.currentFrame = -1;
    this.score = 0;

    this._initScore();

    this.failCallback = function () { };

    //console test
    window.jumper = this.jumper;
    window.models = this.models;
    window.camera = this.camera;
    window.cameraPos = this.cameraPos;
}

Game.prototype.constructor = Game;

Object.assign(Game.prototype, {

    // 随机产生一个图形
    createCube: function () {
        //生成形状
        var cubeType = Math.random() > 0.5 ? 'cube' : 'cylinder';

        var geometry = cubeType === 'cube' ?
            new THREE.CubeGeometry(this.config.cubeX, this.config.cubeY, this.config.cubeZ) :
            new THREE.CylinderGeometry(this.config.cylinderRadius, this.config.cylinderRadius, this.config.cylinderHeight, 100);
        var color = cubeType === 'cube' ? this.config.cubeColor : this.config.cylinderColor;
        var material = new THREE.MeshLambertMaterial({ 
            color: 0x000,
            // color: color,
            transparent: true,
            opacity: 0
        });
        var mesh = new THREE.Mesh(geometry, material);

        // 生成位置
        var relativePos = Math.random() > 0.5 ? 'zDir' : 'xDir';
        if (this.cubes.length) {
            var dis = this.getRandomValue(this.config.cubeMinDis, this.config.cubeMaxDis);
            var lastcube = this.cubes[this.cubes.length - 1];
            if (relativePos === 'zDir') {
                if (cubeType === 'cube') {
                    if (lastcube.geometry instanceof THREE.CubeGeometry){
                        // 方体 -> 方体
                        let pos = {x: lastcube.position.x, y: lastcube.position.y, z: lastcube.position.z - dis - this.config.cubeZ};
                        this.createModel(pos)
                        mesh.position.set(pos.x, pos.y, pos.z);
                    }
                    else {
                        // 方体 -> 圆柱体
                        let pos = {x: lastcube.position.x, y: lastcube.position.y, z: lastcube.position.z - dis - this.config.cylinderRadius - this.config.cubeZ / 2};
                        this.createModel(pos)
                        mesh.position.set(pos.x, pos.y, pos.z);
                    }
                } else {
                    if (lastcube.geometry instanceof THREE.CubeGeometry){
                        //  圆柱体 -> 方体
                        let pos = {x: lastcube.position.x, y: lastcube.position.y, z: lastcube.position.z - dis - this.config.cylinderRadius - this.config.cubeZ / 2};
                        this.createModel(pos)
                        mesh.position.set(pos.x, pos.y, pos.z);
                    }
                    else{
                        // 圆柱体 -> 圆柱体
                        let pos = {x: lastcube.position.x, y: lastcube.position.y, z: lastcube.position.z - dis - this.config.cylinderRadius * 2};
                        this.createModel(pos)
                        mesh.position.set(pos.x, pos.y, pos.z);
                    }
                }
            } else if (relativePos === 'xDir') {
                if (cubeType === 'cube') {
                    if (lastcube.geometry instanceof THREE.CubeGeometry){
                        // 方体 -> 方体
                        let pos = {x: lastcube.position.x + dis + this.config.cubeX, y: lastcube.position.y, z: lastcube.position.z};
                        this.createModel(pos)
                        mesh.position.set(pos.x, pos.y, pos.z);
                    }else{
                        // 方体 -> 圆柱体
                        let pos = {x: lastcube.position.x + dis + this.config.cubeX / 2 + this.config.cylinderRadius, y: lastcube.position.y, z: lastcube.position.z};
                        this.createModel(pos)
                        mesh.position.set(pos.x, pos.y, pos.z);
                    }
                } else {
                    if (lastcube.geometry instanceof THREE.CubeGeometry){
                        // 圆柱体 -> 方体
                        let pos = {x: lastcube.position.x + dis + this.config.cylinderRadius + this.config.cubeX / 2, y: lastcube.position.y, z: lastcube.position.z};
                        this.createModel(pos)
                        mesh.position.set(pos.x, pos.y, pos.z);
                    }
                    else{
                        // 圆柱体 -> 圆柱体
                        let pos = {x: lastcube.position.x + dis + this.config.cylinderRadius * 2, y: lastcube.position.y, z: lastcube.position.z};
                        this.createModel(pos)
                        mesh.position.set(pos.x, pos.y, pos.z);
                    }

                }
            }
        } else {
            this.createModel({x: 0, y: 0, z: 0})
            mesh.position.set(0, 0, 0);
        }

        //渲染
        this.testPosition(mesh.position);
        this.cubes.push(mesh);
        this.scene.add(mesh);
        this._render();
        // 如果缓存图形数大于最大缓存数，去掉一个
        if (this.cubes.length > this.config.cubeMaxLen) {
            this.scene.remove(this.cubes.shift());
        }
        let _this = this;
        if (_this.cubes.length > 1) {
            // 更新相机位置
            _this._updateCameraPos();
        } else {
            _this.camera.lookAt(this.cameraPos.current);
        }
    },

    // 创建一个弹跳体
    createJumper: function () {
        
        var geometry = new THREE.CylinderGeometry(this.config.jumpTopRadius, this.config.jumpBottomRadius, 1.7, 100);
        var material = new THREE.MeshLambertMaterial({ color: this.config.jumpColor });
        var mesh = new THREE.Mesh(geometry, material);
        geometry.translate(0, this.config.jumpHeight / 2, 0);
        mesh.position.set(0, this.config.jumpHeight / 2, 0);
        mesh.castShadow=true;
        mesh.receiveShadow=true;
        this.jumper = mesh;
        this.scene.add(mesh);
        this._render();
    },

    createModel: function(position) {
        var _this = this;
        // console.log(this.config.modelConfig)

        let name = this.getRandomItem(this.config.modelConfig.objList).ele;

        //BUG HERE
        //没有Object create时，objConfig是一样的，第一个模型还没加载上第二个模型的位置参数就覆盖了它，因此两个会重叠在同一位置！
        let objConfig = Object.create(this.config.modelConfig[name]);
        
        // console.log(`${name}`, position.x, position.y, position.z)
        // console.log(`${name}`, objConfig.position)
        objConfig.position = position;
        // console.log(`${name}`, objConfig.position)
        // console.log(objConfig.position == position)
        // console.log(`${name}`, objConfig, position)
        
        // if(window.test){
        //     window.test.push(objConfig)
        // }else{
        //     window.test=[];
        //     window.test.push(objConfig)
        // }

        //callback
        let addModelToGame = (obj) => {
            //添加阴影
            obj.children.forEach(element => {
                element.traverse(function(o) {
                    if (o.type === 'Mesh') {
                        o.castShadow=true;
                        o.receiveShadow=true;
                    }
                })
            });

            //设置参数
            obj.scale.x = objConfig.scale.x;
            obj.scale.y = objConfig.scale.y;
            obj.scale.z = objConfig.scale.z;
            obj.rotation.x = objConfig.rotation.x * Math.PI;
            obj.rotation.y = objConfig.rotation.y * Math.PI;
            obj.rotation.z = objConfig.rotation.z * Math.PI;
            obj.position.x = objConfig.position.x;
            obj.position.y = objConfig.position.y;
            obj.position.z = objConfig.position.z;
            _this.scene.add(obj);

            // 如果缓存图形数大于最大缓存数，去掉一个
            _this.models.push(obj);
            
            // console.log('shift models', _this.cubes.length, _this.config.cubeMaxLen)
            if (_this.models.length > _this.config.cubeMaxLen) {
                _this.removeModel(_this.models[0]);
                _this.models.shift();
            }
        }

        //Loaders
        let mtlLoader = new MTLLoader();
        mtlLoader.load(`./res/obj/${name}.mtl`, function (materials) {
            materials.preload();
            let objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load(`./res/obj/${name}.obj`, addModelToGame)
        })

    },

    removeModel: function(model){
        // 删除内存
        model.children.forEach(element => {
            element.traverse(function(obj) {
                if (obj.type === 'Mesh') {
                  obj.geometry.dispose();
                  if (obj.material instanceof Array){
                        obj.material.forEach(element => {
                            element.dispose();
                        });
                    }else{
                      obj.material.dispose();
                  }
                }
            })
        });
        // 从场景中删除
        this.scene.remove(model);
    },

    createPlane: function(){
        var planeGeo = new THREE.PlaneGeometry(100,100,10,10);//创建平面
        var planeMat = new THREE.MeshLambertMaterial({  //创建材料
            color:0xFFFF33,
            wireframe:false
        });
        var planeMesh = new THREE.Mesh(planeGeo, planeMat);//创建网格模型
        planeMesh.position.set(0, -this.config.cubeY/2, 0);//设置平面的坐标
        planeMesh.rotation.x = -0.5 * Math.PI;//将平面绕X轴逆时针旋转90度
        planeMesh.receiveShadow = true;//允许接收阴影
        // planeMesh.castShadow = true;//允许接收阴影
        this.scene.add(planeMesh);//将平面添加到场景中

        //测试阴影

    },

    _render: function () {
        this.renderer.render(this.scene, this.camera);
    },

    _updateCameraPos: function () {

        let a = this.cubes[this.cubes.length - 2];
        let b = this.cubes[this.cubes.length - 1];
        let dis = {
            x: b.position.x - a.position.x,
            y: 0,
            z: b.position.z - a.position.z
        }
        this.cameraPos.current = {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: this.camera.position.z,
        }
        this.cameraPos.next = {
            x: this.camera.position.x + dis.x,
            y: 0,
            z: this.camera.position.z + dis.z,
        }
        this.cameraSpeed = {
            x: dis.x / this.CAMERA_MOVE_TIME,
            y: 0,
            z: dis.z / this.CAMERA_MOVE_TIME,
        }
        this._updateCamera(0);
    },

    _updateCamera: function (frame) {
        if(frame > this.CAMERA_MOVE_TIME){
            return
        }else frame+=1;
        
        let dir = this.getDirection();
        if(dir === 'x'){
            let dis = Tween.prototype.Quart.easeInOut(frame, this.cameraPos.current.x, this.cameraPos.next.x-this.cameraPos.current.x, this.CAMERA_MOVE_TIME);
            // console.log(this.cameraPos, dis, frame, this.CAMERA_MOVE_TIME)
            this.camera.position.x = dis;
        }else if(dir === 'z'){
            let dis = Tween.prototype.Quart.easeInOut(frame, this.cameraPos.current.z, this.cameraPos.next.z - this.cameraPos.current.z, this.CAMERA_MOVE_TIME);
            this.camera.position.z = dis;
        }
        
        // this.camera.position.x = this.camera.position.x + this.cameraSpeed.x;
        // this.camera.position.z = this.camera.position.z + this.cameraSpeed.z;
        
        this._render();

        let _this = this;
        requestAnimationFrame(function () {
            _this._updateCamera(frame);
        });
    },

    _registerEvent: function () {
        this.canvas.addEventListener(this.mouse.down, this._onMouseDown.bind(this));
        this.canvas.addEventListener(this.mouse.up, this._onMouseUp.bind(this));
        window.addEventListener('resize', this._onwindowResize.bind(this), false);
    },

    _destoryEvent: function () {
        this.canvas.removeEventListener(this.mouse.down, this._onMouseDown.bind(this));
        this.canvas.removeEventListener(this.mouse.up, this._onMouseUp.bind(this));
        window.removeEventListener('resize', this._onwindowResize.bind(this), false);

    },

    _onwindowResize: function () {
        this.camera.left = window.innerWidth / -80;
        this.camera.right = window.innerWidth / 80;
        this.camera.top = window.innerHeight / 80;
        this.camera.bottom = window.innerHeight / -80;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    _onMouseDown: function () {
        // console.log(this.speed, this.accelerate)
        this.mouseState = -1;
        if (this.jumper.scale.y > 0.2) { //控制一个域值
            this.jumper.scale.y -= 0.01;
            this.speed.x += this.ADDSPEED;
            this.speed.z = this.getNextDistance().z / this.JUMP_FRAME_NUM;
            this._render();
            requestAnimationFrame(function () {
                if (this.mouseState === -1) this._onMouseDown();
            }.bind(this));
        }
    },

    _onMouseUp: function () {
        var self = this;
        this.mouseState = 1;
        if (this.jumper.position.y >= this.config.jumpHeight / 2) {
            // jumper还在空中运动
            this.currentFrame = this.currentFrame + 1;
            var dir = this.getDirection();
            if (dir === 'x') {
                this.jumper.position.x += this.speed.x;
                this.jumper.position.y += this.speed.y;
                this.jumper.position.z += this.speed.z;
                this.jumper.rotation.z = this.getRotation();
                // console.log('rZ', this.jumper.rotation.z)
                // console.log('cF', this.currentFrame)
            } else {
                this.jumper.position.z -= this.speed.x;
                this.jumper.position.y += this.speed.y;
                this.jumper.position.x += this.speed.z;
                this.jumper.rotation.x = this.getRotation();
                // console.log('rX', this.jumper.rotation.x)
                // console.log('cF', this.currentFrame)
            }
            this._render();
            // 垂直方向先上升后下降
            this.speed.y -= this.accelerate.y;
            // jumper要恢复
            if (this.jumper.scale.y < 1) {
                this.jumper.scale.y += 0.02;
            }
            requestAnimationFrame(function () {
                this._onMouseUp();
            }.bind(this));
        } else {
            // jumper降落了
            var type = this.getJumpState();
            this.resetJumper();
            if (type === 1) {
                // 落在当前块上
            } else if (type === 2) {
                // 成功降落
                this.score += 1;
                this._updateScore();
                this.createCube();
            } else if (type === 3){
                // 完美降落中心
                this.score += 4;
                this._updateScore();
                this.createCube();
            } else if (type === -2) {
                // 落到大地上动画
                function continuefalling() {
                    if (self.jumper.position.y >= -self.config.jumpHeight / 2) {
                        self.jumper.position.y -= 0.06;
                        self._render();
                        requestAnimationFrame(continuefalling);
                    }
                };
                continuefalling()
                if (this.failCallback) {
                    setTimeout(function () {
                        self.failCallback(self.score);
                    }, 1000);
                }
            } else {
                // 落到边缘处
                this.failingAnimation(type);
                if (this.failCallback) {
                    setTimeout(function () {
                        self.failCallback(self.score);
                    }, 1000);
                }
            }
        }
    },

    _initScore: function () {
        var el = document.createElement('div');
        el.id = "score";
        el.innerHTML = '0';
        document.body.appendChild(el);
    },

    _updateScore: function () {
        document.getElementById('score').innerHTML = this.score;
    },

    start: function () {
        this.createPlane();
        this.createCube();
        this.createCube();
        this.createJumper();
        this._registerEvent();
        this._updateScore();
    },

    restart: function () {
        for (var i = 0, len = this.cubes.length; i < len; i++) {
            this.scene.remove(this.cubes[i]);
        }
        for (var i = 0, len = this.models.length; i < len; i++) {
            this.removeModel(this.models[i]);
        }
        this.models.length = 0;
        this.scene.remove(this.jumper);

        this.cameraPos = {
            current: new THREE.Vector3(0, 0, 0), // 摄像机当前的坐标
            next: new THREE.Vector3() // 摄像机即将要移到的位置
        };
        this.cubes = [];
        this.jumper = null;
        this.mouseState = 0;
        this.xspeed = 0;
        this.yspeed = 0;
        this.score = 0;

        this.createCube();
        this.createCube();
        this.createJumper();
        this._updateScore();
    },

    resetJumper: function () {
        this.currentFrame = -1;
        this.jumper.scale.y = 1;
        this.jumper.position.y = this.config.jumpHeight / 2;
        this.jumper.rotation.x = 0;
        this.jumper.rotation.z = 0;
        this.speed.x = 0;
        this.speed.y = this.accelerate.y * this.JUMP_FRAME_NUM / 2;
        this.speed.z = 0;
    },

    stop: function () {

    },

    getRandomValue: function (min, max) {
        // min <= value < max
        return Math.floor(Math.random() * (max - min)) + min;
    },

    getRandomItem: function(list){
        let random_i = this.getRandomValue(0, list.length);
        return {
            i: random_i, 
            ele: list[random_i]
        }
    },

    failingAnimation: function (state) {
        var rotateAxis = this.getDirection() === 'z' ? 'x' : 'z';
        var rotateAdd, rotateTo;
        if (state === -1) {
            rotateAdd = this.jumper.rotation[rotateAxis] - 0.1;
            rotateTo = this.jumper.rotation[rotateAxis] > -Math.PI / 2;
        } else {
            rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
            rotateTo = this.jumper.rotation[rotateAxis] < Math.PI / 2;
        }
        if (rotateTo) {
            this.jumper.rotation[rotateAxis] = rotateAdd;
            this._render();
            requestAnimationFrame(function () {
                this.failingAnimation(state);
            }.bind(this));
        } else {
            var self = this;
            function continuefalling() {
                if (self.jumper.position.y >= -self.config.jumpHeight / 2) {
                    self.jumper.position.y -= 0.06;
                    self._render();
                    requestAnimationFrame(continuefalling);
                }
            };
            continuefalling()
        }
    },

    /*
    * 根据落点判断是否成功或失败，共分为以下几种情况
    * 返回值 1： 成功，但落点仍然在当前块上
    * 返回值 2： 成功，落点在下一个块上
    * 返回值 3： 成功，落点在中心点
    * 返回值 -1：失败，落点在当前块边缘 或 在下一个块外边缘
    * 返回值 -2：失败，落点在当前块与下一块之间 或 在下一个块之外
    * 返回值 -3：失败，落点在下一个块内边缘
     */
    getJumpState: function () {
        var jumpR = this.config.jumpBottomRadius;
        var vard = this.getCurrentDistance();
        var d = vard.d;
        var d1 = vard.d1;
        var d2 = vard.d2;
        var d3 = vard.d3;
        var d4 = vard.d4;
        if (d <= d1) {
            return 1;
        } else if (d > d1 && Math.abs(d - d1) <= jumpR) {
            return -1;
        } else if (Math.abs(d - d1) > jumpR && d < d2 && Math.abs(d - d2) >= jumpR) {
            return -2;
        } else if (d < d2 && Math.abs(d - d2) < jumpR) {
            return -3;
        } else if (d > d2 && d <= d4) {
            //完美落点
            if (d >= (d3 - 0.2) && d <= (d3 + 0.2)){
                return 3;
            }
            else return 2;
        } else if (d > d4 && Math.abs(d - d4) < jumpR) {
            return -1;
        } else {
            return -2;
        }
    },

    getCurrentDistance: function () {
        var d, d1, d2, d3, d4;
        var fromObj = this.cubes[this.cubes.length - 2];
        var fromPosition = fromObj.position;
        var fromType = fromObj.geometry instanceof THREE.CubeGeometry ? 'cube' : 'cylinder';
        var toObj = this.cubes[this.cubes.length - 1];
        var toPosition = toObj.position;
        var toType = toObj.geometry instanceof THREE.CubeGeometry ? 'cube' : 'cylinder';
        var jumpObj = this.jumper;
        var position = jumpObj.position;

        if (fromType === 'cube') {
            if (toType === 'cube') {
                if (fromPosition.x === toPosition.x) {
                    // -z 方向
                    d = Math.abs(position.z);
                    d1 = Math.abs(fromPosition.z - this.config.cubeZ / 2);
                    d2 = Math.abs(toPosition.z + this.config.cubeZ / 2);
                    d3 = Math.abs(toPosition.z);
                    d4 = Math.abs(toPosition.z - this.config.cubeZ / 2);
                } else {
                    // x 方向
                    d = Math.abs(position.x);
                    d1 = Math.abs(fromPosition.x + this.config.cubeX / 2);
                    d2 = Math.abs(toPosition.x - this.config.cubeX / 2);
                    d3 = Math.abs(toPosition.x);
                    d4 = Math.abs(toPosition.x + this.config.cubeX / 2);
                }
            } else {
                if (fromPosition.x === toPosition.x) {
                    // -z 方向
                    d = Math.abs(position.z);
                    d1 = Math.abs(fromPosition.z - this.config.cubeZ / 2);
                    d2 = Math.abs(toPosition.z + this.config.cylinderRadius);
                    d3 = Math.abs(toPosition.z);
                    d4 = Math.abs(toPosition.z - this.config.cylinderRadius);
                } else {
                    // x 方向
                    d = Math.abs(position.x);
                    d1 = Math.abs(fromPosition.x + this.config.cubeX / 2);
                    d2 = Math.abs(toPosition.x - this.config.cylinderRadius);
                    d3 = Math.abs(toPosition.x);
                    d4 = Math.abs(toPosition.x + this.config.cylinderRadius);
                }
            }
        } else {
            if (toType === 'cube') {
                if (fromPosition.x === toPosition.x) {
                    // -z 方向
                    d = Math.abs(position.z);
                    d1 = Math.abs(fromPosition.z - this.config.cylinderRadius);
                    d2 = Math.abs(toPosition.z + this.config.cubeZ / 2);
                    d3 = Math.abs(toPosition.z);
                    d4 = Math.abs(toPosition.z - this.config.cubeZ / 2);
                } else {
                    // x 方向
                    d = Math.abs(position.x);
                    d1 = Math.abs(fromPosition.x + this.config.cylinderRadius);
                    d2 = Math.abs(toPosition.x - this.config.cubeX / 2);
                    d3 = Math.abs(toPosition.x);
                    d4 = Math.abs(toPosition.x + this.config.cubeX / 2);
                }
            } else {
                if (fromPosition.x === toPosition.x) {
                    // -z 方向
                    d = Math.abs(position.z);
                    d1 = Math.abs(fromPosition.z - this.config.cylinderRadius);
                    d2 = Math.abs(toPosition.z + this.config.cylinderRadius);
                    d3 = Math.abs(toPosition.z);
                    d4 = Math.abs(toPosition.z - this.config.cylinderRadius);
                } else {
                    // x 方向
                    d = Math.abs(position.x);
                    d1 = Math.abs(fromPosition.x + this.config.cylinderRadius);
                    d2 = Math.abs(toPosition.x - this.config.cylinderRadius);
                    d3 = Math.abs(toPosition.x);
                    d4 = Math.abs(toPosition.x + this.config.cylinderRadius);
                }
            }
        }

        return { d: d, d1: d1, d2: d2, d3: d3, d4: d4 };
    },

    getNextDistance: function () {
        var d, d1, d2, d3, d4;
        var fromObj = this.cubes[this.cubes.length - 2];
        var fromPosition = fromObj.position;
        var fromType = fromObj.geometry instanceof THREE.CubeGeometry ? 'cube' : 'cylinder';

        var toObj = this.cubes[this.cubes.length - 1];
        var toPosition = toObj.position;
        var toType = toObj.geometry instanceof THREE.CubeGeometry ? 'cube' : 'cylinder';

        var jumpObj = this.jumper;
        var position = jumpObj.position;

        var direction = this.getDirection();
        var distance = {
            x: 0,   //暂时没用，先初始化0
            y: 0,   //暂时没用，先初始化0
            z: 0
        }
        if (direction === 'x') {
            distance.z = toPosition.z - position.z
        } else if (direction === 'z') {
            distance.z = toPosition.x - position.x
        }
        return distance;
    },

    getDirection: function () {
        var direction;
        if (this.cubes.length > 1) {
            var from = this.cubes[this.cubes.length - 2];
            var to = this.cubes[this.cubes.length - 1];
            if (from.position.z === to.position.z) direction = 'x';
            if (from.position.x === to.position.x) direction = 'z';
        }
        return direction;
    },

    getRotation: function () {
        let time = this.currentFrame;
        return -Tween.prototype.Quint.easeInOut(time, 0, 2 * Math.PI, 40);
    },

    getXXX: function(a,b,c,d){
        return Tween.prototype.Quint.easeInOut(a,b,c,d);
    },

    testPosition: function (position) {
        if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
            console.log('position incorrect！');
        }
    },

    isPC: function () {
        var userAgentInfo = navigator.userAgent;
        var Agents = ["Android", "iPhone",
            "SymbianOS", "Windows Phone",
            "iPad", "iPod"];
        var flag = true;
        for (var v = 0; v < Agents.length; v++) {
            if (userAgentInfo.indexOf(Agents[v]) > 0) {
                flag = false;
                break;
            }
        }
        return flag;
    },
});

export {
    Game
}