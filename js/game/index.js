import { Game } from './game'

function init() {
    window.onload = function () {
        var game = new Game();

        var startpage = document.querySelector('.startPage');
        var restartpage = document.querySelector('.restartPage');
        var startBtn = document.querySelector('.start-btn');
        var restartBtn = document.querySelector('.restart-btn');
        var scoreEl = document.querySelector('.score');

        startpage.style.display = 'flex';
        restartpage.style.display = 'none';

        startBtn.addEventListener('click', function () {
            startpage.style.display = 'none';
            game.start();
        });

        restartBtn.addEventListener('click', function () {
            restartpage.style.display = 'none';
            game.restart();
        });

        //游戏失败回调函数
        game.failCallback = function (score) {
            restartpage.style.display = 'flex';
            scoreEl.innerHTML = score;
        };
    };
}

export {
    init
}