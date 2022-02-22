'use strict';
const board = document.querySelector("[board]")
var pressedKeys = {};
var resetFlag = false;

function startInteraction() {
    document.addEventListener("click", handleMouseClick)
    document.addEventListener("keydown", handleKeyPress)
    document.onkeyup = function(e) { pressedKeys[e.key] = false; }
    document.onkeydown = function(e) { pressedKeys[e.key] = true; }
}

function stopInteraction() {
    document.removeEventListener("click", handleMouseClick)
    document.removeEventListener("keydown", handleKeyPress)
}

function handleMouseClick(e) {
    if (e.target.matches("[data-key]")){
        pressKey(e.target.dataset.key)
        return;
    } else if (e.target.matches("[data-enter]")) {
        submitBoard();
        return;
    } else if (e.target.matches("[data-remove]")) {
        deleteKey();
        return;
    }
}

function handleKeyPress(e) {
    if (e.key === "Enter") {
        submitBoard();
        return;
    } else if (e.key === "Backspace") {
        deleteKey();
        return;
    } else if (e.key.match(/^[1-9]$/)) {
        pressKey(e.key);
        return;
    }
}

function clicked(col, row) {
    if (!pressedKeys["Shift"]) {
        for (let i = 0; i < 81; i++) {
            var j = board.querySelectorAll(".sudoku-board")[i]
            j.dataset.selected = "false"
        }
    }
    document.getElementById("Hi").innerHTML = `Column:${col}\n Row:${row}`
    const index = ((row-1)*9 + col) - 1
    const square = board.querySelectorAll(".sudoku-board")[index]
    square.dataset.selected = "true"
}

function pressKey(key) {
    var currentBoard = board.querySelectorAll("[data-selected='true']")
    for (let i = 0; i < currentBoard.length; i++) {
        const square = currentBoard[i]
        square.textContent = key
    }
}

const seventeenClueBoard = [0,0,0,0,5,0,3,0,6,
1,0,0,6,0,0,0,0,0,
0,0,0,0,0,0,7,0,0,
2,0,0,0,0,0,5,4,0,
0,0,0,0,0,3,0,0,0,
0,0,0,0,0,6,0,0,0,
0,0,0,2,4,0,0,1,0,
0,3,0,0,0,0,0,8,0,
0,0,7,0,0,0,0,0,0]

function test() {
    stopInteraction()
    var startingBoard = seventeenClueBoard
    displayBoard(startingBoard)
    // backTracking(startingBoard, startingBoard, 0)
    var t = trampoline(backTracking)
    var x = t(startingBoard, startingBoard.slice(0), -1)
    console.log(x)
    // displayBoard(x)
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function reset() {
    resetFlag = true;
    resetBoard();
    // sleep(2000)
    // resetBoard();
    
}

function resetBoard() {
    for (let i = 0; i < 81; i++) {
        board.querySelectorAll(".sudoku-board")[i].textContent = ""
        board.querySelectorAll(".sudoku-board")[i].dataset.state = ""
    }
    startInteraction();
    resetFlag = false;
    // throw new Error('Board Reset')
    console.log("hi")
    return "reset";
}

function submitBoard() {
    stopInteraction()
    var startingBoard = []
    for (let i = 0; i < 81; i++) {
        if (board.querySelectorAll(".sudoku-board")[i].textContent == "") {
            startingBoard[i] = 0
            board.querySelectorAll(".sudoku-board")[i].dataset.state = "not-definite"
        } else {
            startingBoard[i] = parseInt(board.querySelectorAll(".sudoku-board")[i].textContent)
            board.querySelectorAll(".sudoku-board")[i].dataset.state = "definite"
        }
        board.querySelectorAll(".sudoku-board")[i].dataset.selected = "false"
    }
    // backTracking(startingBoard, startingBoard, 0)
    // var sudokuWorker = new Worker('sudoku.js')
    // sudokuWorker.onmessage = function(e) {
    //     result.textContent = e.data; 
    // }
    var t = trampoline(backTracking)
    var x = t(startingBoard, startingBoard.slice(0), -1)
    console.log(x)
    // displayBoard(x)
}

function displayBoard(currentBoard, i=0) {
    if (i < 81) {
        window.requestAnimationFrame( () => { //updates html
            board.querySelectorAll( )[i].textContent = currentBoard[i];
            displayBoard(currentBoard, i + 1);
        } );
    }
}

function updateBoardAtPos(currentBoard, pos) {
    if (resetFlag) return;
    try {
        board.querySelectorAll(".sudoku-board")[pos].textContent = currentBoard[pos];
    } catch (error) {
        console.log("whoops")
    }
    // board.querySelectorAll(".sudoku-board")[pos].textContent = currentBoard[pos];
}


function backTracking(startingBoard, currentBoard, pos) {
    // displayBoard(currentBoard);
    window.requestAnimationFrame(function(){ return updateBoardAtPos(currentBoard, pos); })
    // if (resetFlag) return;
    var checks = check(currentBoard)
    if (checks == "complete") return currentBoard;
    if (checks == "working"){
        if (currentBoard[pos] !== 0) {
            var { currentBoard, pos, fail1} = findNextPos(startingBoard, currentBoard, pos);
        }
    } else {
        if (pos == -1) return "broken";
    }
    var { currentBoard, pos, fail2} = increase(startingBoard, currentBoard, pos);
    if (fail1 || fail2) {
        console.log("broken", fail1, fail2)
        //Turn to guard clause once bugtesting over
        return "broken";
    }
    
    return () => backTracking(startingBoard, currentBoard, pos);
}

//Tail Call Optimization fix.
const trampoline = fn => (...args) => {
    let result = fn(...args)
    //repeatedly call the function till you hit your base case
    while (typeof result === 'function') {
      result = result();
    }
    return result;
  }

function findPrevPos(startingBoard, pos) {
    if (pos === 0) return -1;
    if (startingBoard[pos-1] == 0) return pos-1;
    return findPrevPos(startingBoard, pos-1);
}

function findNextPos(startingBoard, currentBoard, pos) {
    if (pos == 80) return {currentBoard: currentBoard, pos: pos, fail: true};
    if (startingBoard[pos+1] == 0) return {currentBoard: currentBoard, pos: pos+1, fail: false};
    return findNextPos(startingBoard, currentBoard, pos+1);
}

function increase(startingBoard, currentBoard, pos) {
    if (currentBoard[pos] < 9) {
        currentBoard[pos]++
        return {currentBoard: currentBoard, pos: pos, fail: false}
    } else {
        currentBoard[pos] = 0;
        var prevPos = findPrevPos(startingBoard, pos)
        if (prevPos == -1) return {currentBoard: currentBoard, pos: pos, fail: true}
        return increase(startingBoard, currentBoard, prevPos)
    }
}

function check(currentBoard) {
    var rows = [[],[],[],[],[],[],[],[],[]]
    var columns = [[],[],[],[],[],[],[],[],[]]
    var boxes = [[],[],[],[],[],[],[],[],[]]
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            rows[i].push(currentBoard[(i*9)+j])
            columns[i].push(currentBoard[(j*9)+(i)])
        }
    }

    for (let i = 0; i < 9; i += 3) {
        for (let j = 0; j < 9; j += 3) {
            for (let k = 0; k < 3; k++) {
                boxes[i+(j/3)].push(currentBoard[ ( (i+k) * 9 ) + j ])
                boxes[i+(j/3)].push(currentBoard[ ( (i+k) * 9 ) + (j+1) ])
                boxes[i+(j/3)].push(currentBoard[ ( (i+k) * 9 ) + (j+2) ])
            } // https://imgur.com/a/lw3xViS - The logic works
        }
    }
    console.log(`rowscheck: ${miniCheck(rows)}, columnscheck:${miniCheck(columns)}, boxescheck:${miniCheck(boxes)}`)
    if (miniCheck(rows) && miniCheck(columns) && miniCheck(boxes)){
        
        if (!checkZeros(currentBoard)) return "complete";
        return "working";
    }
    return "broken";
}

function miniCheck(array2d) {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            for (let k = j+1; k < 9; k++) {
                if (array2d[i][j] != 0) {
                    if (array2d[i][j] === array2d[i][k]) return false;
                }
            }
        }
    }
    return true;
}

function checkZeros(currentBoard) {
    for (let i = 0; i < 81; i++) {
        if (currentBoard[i] === 0) return true
    }
    return false
}

startInteraction()