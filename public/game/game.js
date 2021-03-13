const socket = io();
const playerData = JSON.parse(localStorage.getItem('playerData'));
const userData = JSON.parse(localStorage.getItem('userData'));
const userToken = window.localStorage.getItem('userToken');

/*----------- Options ----------*/
const { player1, player2, isWhite, room } = Qs.parse(window.location.search, { ignoreQueryPrefix: true });

socket.emit('joinGame', { playerData, isWhite, room }, (error, player) => {
    if (error) return (window.location.href = '/lobby/lobby.html');

    console.log(`${player.username} joined room: ${player.room}`);
    playerData.id = socket.id;
});

/*----------- Object Makers ----------*/
class Piece {
    constructor(color) {
        this.color = color;
        this.isKing = false;
    }
}
class Move {
    constructor(startLocation, endLocation, isMandatory) {
        this.startLocation = startLocation;
        this.endLocation = endLocation;
        this.isMandatory = isMandatory;
    }
}
class Player {
    constructor({ id, username, rating }, color) {
        this.id = id;
        this.username = username;
        this.rating = rating;
        this.color = color;
        this.arsenal = document.querySelectorAll(color ? '.white-piece' : '.black-piece');
    }
}

/*---------- Game Logic ----------*/
const addClickToArsenal = () => {
    for (let i = 0; i < playerArsenal.length; i++) playerArsenal[i].addEventListener('click', logicOfClick);
};

const logicOfClick = (event) => {
    event.stopPropagation();
    indexClickedPiece = null;
    removePiecesAndMovesColor();
    givePieceAndMovesColor(event);
};

const removePiecesAndMovesColor = () => {
    for (let i = 0; i < playerArsenal.length; i++) playerArsenal[i].style = '';
    for (let i = 0; i < cells.length; i++) cells[i].style = '';
};

const givePieceAndMovesColor = (event) => {
    if (indexClickedPiece === null) indexClickedPiece = cellsArray.indexOf(event.target.parentElement);
    cells[indexClickedPiece].firstElementChild.style = 'border: 3px solid green';
    for (let i = 0; i < allAvailbleMoves.length; i++)
        if (indexClickedPiece === allAvailbleMoves[i].startLocation)
            cells[allAvailbleMoves[i].endLocation].style = 'background-color: yellow;';
};

const makeMove = (event) => {
    let indexMove = findIndexMove(cellsArray.indexOf(event.target));
    if (indexClickedPiece === null || indexMove === null) return;
    let move = allAvailbleMoves[indexMove];
    let piece = cells[indexClickedPiece].firstElementChild;
    kingMoves += board[move.startLocation].isKing ? 1 : 0;
    if (playerTurn ? move.endLocation >= 0 && move.endLocation <= 7 : move.endLocation >= 56 && move.endLocation <= 63)
        board[move.startLocation].isKing = true;
    updateCells(piece, move);
    whitePlayer.arsenal = document.querySelectorAll('.white-piece');
    blackPlayer.arsenal = document.querySelectorAll('.black-piece');
    updateBoard(move);
    socket.emit(
        'sendUpdatedGameData',
        {
            piece,
            move,
            kingMoves,
        },
        () => console.log('Updated game data recieved!')
    );
    removePiecesAndMovesColor();
    removeClickToArsenal();
    indexClickedPiece = move.endLocation;
    if (move.isMandatory && checkForSuccessiveMoves()) {
        allAvailbleMoves = getAllJumps();
        givePieceAndMovesColor();
    } else {
        indexClickedPiece = null;
        changePlayerTurn();
    }
};

const findIndexMove = (endLocation) => {
    for (let indexMove = 0; indexMove < allAvailbleMoves.length; indexMove++)
        if (
            indexClickedPiece === allAvailbleMoves[indexMove].startLocation &&
            endLocation === allAvailbleMoves[indexMove].endLocation
        )
            return indexMove;
    return null;
};

const updateCells = (piece, move) => {
    if (board[move.startLocation].isKing)
        cells[move.endLocation].innerHTML = `<p class="${playerTurn ? 'white-piece king' : 'black-piece king'}" id="${
            piece.id
        }"></p>`;
    else
        cells[move.endLocation].innerHTML = `<p class="${playerTurn ? 'white-piece' : 'black-piece'}" id="${
            piece.id
        }"></p>`;
    let direction = (move.endLocation - move.startLocation) % 7 === 0 ? 7 : 9;
    if (move.endLocation - move.startLocation < 0) direction = -direction;
    if (move.endLocation - move.startLocation > 0)
        for (let i = move.startLocation; i < move.endLocation; i += direction) cells[i].innerHTML = '';
    else for (let i = move.startLocation; i > move.endLocation; i += direction) cells[i].innerHTML = '';
    let countMandatoryMoves = 0;
    for (let i = 0; i < allAvailbleMoves.length; i++) if (allAvailbleMoves[i].isMandatory) countMandatoryMoves++;
    if (!move.isMandatory && countMandatoryMoves > 0)
        for (let i = 0; i < allAvailbleMoves.length; i++) {
            if (allAvailbleMoves[i].isMandatory) cells[allAvailbleMoves[i].startLocation].innerHTML = '';
            if (
                !move.isMandatory &&
                allAvailbleMoves[i].startLocation === move.startLocation &&
                allAvailbleMoves[i].isMandatory
            )
                cells[move.endLocation].innerHTML = '';
        }
    cellsArray = [...cells];
};

const updateBoard = (move) => {
    let direction = (move.endLocation - move.startLocation) % 7 === 0 ? 7 : 9;
    if (move.endLocation - move.startLocation < 0) direction = -direction;
    board[move.endLocation] = board[move.startLocation];
    if (move.endLocation - move.startLocation > 0)
        for (let i = move.startLocation; i < move.endLocation; i += direction) board[i] = null;
    else for (let i = move.startLocation; i > move.endLocation; i += direction) board[i] = null;
    let countMandatoryMoves = 0;
    for (let i = 0; i < allAvailbleMoves.length; i++) if (allAvailbleMoves[i].isMandatory) countMandatoryMoves++;
    if (!move.isMandatory && countMandatoryMoves > 0)
        for (let i = 0; i < allAvailbleMoves.length; i++) {
            if (allAvailbleMoves[i].isMandatory) board[allAvailbleMoves[i].startLocation] = null;
            if (
                !move.isMandatory &&
                allAvailbleMoves[i].startLocation === move.startLocation &&
                allAvailbleMoves[i].isMandatory
            )
                board[move.endLocation] = null;
        }
};

const removeClickToArsenal = () => {
    for (let i = 0; i < playerArsenal.length; i++) playerArsenal[i].removeEventListener('click', logicOfClick);
};
const checkForSuccessiveMoves = () => {
    for (let endLocation = 0; endLocation < 64; endLocation++)
        if (checkForJumps(indexClickedPiece, endLocation)) return true;
    return false;
};

const getAllJumps = () => {
    let allJumps = [];
    for (let endLocation = 0; endLocation < 64; endLocation++)
        if (checkForJumps(indexClickedPiece, endLocation))
            allJumps.push(new Move(indexClickedPiece, endLocation, true));
    return allJumps;
};

const changePlayerTurn = () => {
    if (checkArsenalLength()) gameOver();
    if (playerTurn) {
        playerTurn = false;
        whiteTurn.style.color = 'rgba(255, 255, 255, 0.2)';
        blackTurn.style.color = '#D9D9D9';
    } else {
        playerTurn = true;
        whiteTurn.style.color = '#D9D9D9';
        blackTurn.style.color = 'rgba(255, 255, 255, 0.2)';
    }
    if (isStalemate()) gameOver();
    if (checkArsenalLength()) gameOver();
    if (checkLengthAllAvailbleMoves()) gameOver();
    allAvailbleMoves = getAllAvailbleMoves();
    playerArsenal = playerTurn ? whitePlayer.arsenal : blackPlayer.arsenal;
    if (playerTurn !== currentPlayer) socket.emit('changePlayerTurn');
};

const getAllAvailbleMoves = () => {
    let availbleMoves = [];
    for (let startLocation = 0; startLocation < 64; startLocation++)
        if (
            board[startLocation] !== undefined &&
            board[startLocation] !== null &&
            board[startLocation].color === playerTurn
        )
            for (let endLocation = 0; endLocation < 64; endLocation++)
                if (canMove(startLocation, endLocation))
                    if (checkForJumps(startLocation, endLocation))
                        availbleMoves.push(new Move(startLocation, endLocation, true));
                    else availbleMoves.push(new Move(startLocation, endLocation, false));
    return availbleMoves;
};

const canMove = (startLocation, endLocation) => {
    if (!board[startLocation].isKing) {
        let direction7 = board[startLocation].color ? -7 : 7;
        let direction9 = board[startLocation].color ? -9 : 9;
        if (
            endLocation - startLocation === direction7 &&
            typeof board[endLocation] !== undefined &&
            board[endLocation] === null
        )
            return true;
        if (endLocation - startLocation === direction9 && board[endLocation] === null) return true;
        if (checkForJumps(startLocation, endLocation)) return true;
        return false;
    } else {
        if (checkForJumps(startLocation, endLocation)) return true;
        let calc = endLocation - startLocation;
        let numOfPossibleMoves;
        let direction;
        if (calc % 7 === 0 && startLocation != endLocation) {
            numOfPossibleMoves = Math.abs(calc / 7);
            direction = calc < 0 ? -7 : 7;
            for (let i = 1; i <= numOfPossibleMoves; i++)
                if (board[startLocation + direction * i] !== null) return false;
            return true;
        }
        if (calc % 9 === 0 && startLocation != endLocation) {
            numOfPossibleMoves = Math.abs(calc / 9);
            direction = calc < 0 ? -9 : 9;
            for (let i = 1; i <= numOfPossibleMoves; i++)
                if (board[startLocation + direction * i] !== null) return false;
            return true;
        }
        return false;
    }
};

const checkForJumps = (startLocation, endLocation) => {
    if (!board[startLocation].isKing) {
        let direction7 = board[startLocation].color ? -7 : 7;
        let direction9 = board[startLocation].color ? -9 : 9;
        if (
            endLocation - startLocation === direction7 * 2 &&
            typeof board[endLocation] !== undefined &&
            board[endLocation] === null &&
            board[startLocation + direction7] !== null &&
            board[startLocation + direction7].color !== board[startLocation].color
        )
            return true;
        if (
            endLocation - startLocation === direction9 * 2 &&
            typeof board[endLocation] !== undefined &&
            board[endLocation] === null &&
            board[startLocation + direction9] !== null &&
            board[startLocation + direction9].color !== board[startLocation].color
        )
            return true;
        return false;
    } else {
        let calc = endLocation - startLocation;
        let numOfPossibleMoves;
        let direction;
        let countEnemyPieces = 0;
        if (calc % 7 === 0 && startLocation != endLocation && board[endLocation] === null) {
            numOfPossibleMoves = Math.abs(calc / 7);
            direction = calc < 0 ? -7 : 7;
            for (let i = 1; i < numOfPossibleMoves; i++)
                if (
                    board[startLocation + direction * i] !== null &&
                    board[startLocation + direction * i].color != playerTurn
                )
                    countEnemyPieces++;
        }
        if (calc % 9 === 0 && startLocation != endLocation && board[endLocation] === null) {
            numOfPossibleMoves = Math.abs(calc / 9);
            direction = calc < 0 ? -9 : 9;
            for (let i = 1; i < numOfPossibleMoves; i++) {
                if (
                    board[startLocation + direction * i] !== null &&
                    board[startLocation + direction * i].color != playerTurn
                )
                    countEnemyPieces++;
            }
        }
        return !(countEnemyPieces > 1 || countEnemyPieces === 0);
    }
};

const checkLengthAllAvailbleMoves = () => {
    if (allAvailbleMoves.length === 0) {
        isGameOver = true;
        return true;
    }
    return false;
};

const checkArsenalLength = () => {
    if ((playerTurn ? whitePlayer.arsenal.length : blackPlayer.arsenal.length) === 0) {
        isGameOver = true;
        return true;
    }
    return false;
};

const isStalemate = () => {
    if (kingMoves === 15) {
        isGameOver = true;
        isDraw = true;
        return true;
    }
    return false;
};

const gameOver = (resignedPlayer) => {
    let winner;
    if (resignedPlayer) {
        winner = resignedPlayer === whitePlayer.username ? blackPlayer.username : whitePlayer.username;
        gameOverModal.firstElementChild.children[0].innerHTML = `${winner} WON!`;
    } else {
        winner = isDraw ? 'DRAW' : playerTurn ? blackPlayer.username : whitePlayer.username;
        gameOverModal.firstElementChild.children[0].innerHTML = isDraw ? 'DRAW!' : `${winner} WON!`;
    }
    let data;
    if (winner === playerData.username || winner === 'DRAW') data = { wins: playerData.rating.wins + 1 };
    else data = { losses: playerData.rating.losses + 1 };

    fetch('/users/me/rating', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(data),
    })
        .then((res) => {
            if (res.ok) return res.json();
            else throw new Error(res);
        })
        .then((data) => {
            console.log(data);
            const gameOverModalRating = document.getElementById('game-over-modal-rating');
            console.log(userData);
            userData.rating = data.rating;
            localStorage.setItem('userData', JSON.stringify(userData));
            gameOverModalRating.innerText = `${data.rating.wins} - ${data.rating.losses}`;
        })
        .catch((err) => alert('Something went Wrong!'));

    gameOverModal.style.display = '';
};

/*----------- Creating The HTML Board and Data Board ----------*/
const htmlBoard = () => {
    const board = document.getElementById('board');
    let element;
    for (let row = 0; row < 8; row++)
        for (let column = 0; column < 8; column++) {
            element = document.createElement('div');
            if (row % 2 === 0) {
                if (column % 2 === 0) {
                    element.className = 'no-piece';
                    board.appendChild(element);
                } else {
                    if (row >= 0 && row <= 2) {
                        element.innerHTML = '<p class="black-piece"></p>';
                        board.appendChild(element);
                    } else if (row > 2 && row < 5) board.appendChild(element);
                    else {
                        element.innerHTML = '<p class="white-piece"></p>';
                        board.appendChild(element);
                    }
                    element.addEventListener('click', makeMove);
                }
            } else {
                if (column % 2 === 0) {
                    if (row >= 0 && row <= 2) {
                        element.innerHTML = '<p class="black-piece"></p>';
                        board.appendChild(element);
                    } else if (row > 2 && row < 5) board.appendChild(element);
                    else {
                        element.innerHTML = '<p class="white-piece"></p>';
                        board.appendChild(element);
                    }
                    element.addEventListener('click', makeMove);
                } else {
                    element.className = 'no-piece';
                    board.appendChild(element);
                }
            }
        }
};
const newBoard = () => {
    return [
        undefined,
        new Piece(false),
        undefined,
        new Piece(false),
        undefined,
        new Piece(false),
        undefined,
        new Piece(false),
        new Piece(false),
        undefined,
        new Piece(false),
        undefined,
        new Piece(false),
        undefined,
        new Piece(false),
        undefined,
        undefined,
        new Piece(false),
        undefined,
        new Piece(false),
        undefined,
        new Piece(false),
        undefined,
        new Piece(false),
        null,
        undefined,
        null,
        undefined,
        null,
        undefined,
        null,
        undefined,
        undefined,
        null,
        undefined,
        null,
        undefined,
        null,
        undefined,
        null,
        new Piece(true),
        undefined,
        new Piece(true),
        undefined,
        new Piece(true),
        undefined,
        new Piece(true),
        undefined,
        undefined,
        new Piece(true),
        undefined,
        new Piece(true),
        undefined,
        new Piece(true),
        undefined,
        new Piece(true),
        new Piece(true),
        undefined,
        new Piece(true),
        undefined,
        new Piece(true),
        undefined,
        new Piece(true),
        undefined,
    ];
};

const renderPlayers = () => {
    const game = document.getElementById('game');
    const html = Mustache.render(playersTemplate, {
        white_username: whitePlayer.username,
        black_username: blackPlayer.username,
    });

    game.insertAdjacentHTML('beforeend', html);
};

htmlBoard();

/*----------- Game Properties ----------*/
let board = newBoard();
const whitePlayer = isWhite === player1.username ? new Player(player1, true) : new Player(player2, true);
const blackPlayer = isWhite === player1.username ? new Player(player2, false) : new Player(player1, false);
const currentPlayer = isWhite === playerData.username;
let playerTurn = true;
let isGameOver = false;
let isDraw = false;
let totalPieces = 24;
let kingMoves = 0;
let allAvailbleMoves = getAllAvailbleMoves();
let playerArsenal = playerTurn ? whitePlayer.arsenal : blackPlayer.arsenal;

/*----------- DOM References ----------*/
const playersTemplate = document.getElementById('players-template').innerHTML;
renderPlayers();

/*----------- DOM References ----------*/
const drawModal = document.getElementById('draw-modal');
const rematchModal = document.getElementById('rematch-modal');
const rematchYesButton = document.getElementById('rematch-modal-yes-button');
const rematchNoButton = document.getElementById('rematch-modal-no-button');
const gameOverModal = document.getElementById('game-over-modal');
const gameResignButton = document.getElementById('game-resign-button');
const gameDrawButton = document.getElementById('game-draw-button');
const gameOverHomeButton = gameOverModal.firstElementChild.children[3];
const gameOverRematchButton = gameOverModal.firstElementChild.children[2];
const drawModalYesButton = document.getElementById('draw-modal-yes-button');
const drawModalNoButton = document.getElementById('draw-modal-no-button');
const whiteTurn = document.getElementById('white-turn');
const blackTurn = document.getElementById('black-turn');
let cells = document.getElementById('board').children;
let cellsArray = [...cells];
let indexClickedPiece = null;

/*----------- Event Listeners ----------*/
gameResignButton.addEventListener('click', () => {
    const resignedPlayer = currentPlayer ? whitePlayer.username : blackPlayer.username;
    socket.emit('resign', resignedPlayer, () => console.log('You resigned!'));
});
gameDrawButton.addEventListener('click', () => {
    socket.emit('drawRequest', room, () => console.log('Your draw request was sent!'));
    gameDrawButton.disabled = true;
});
drawModalYesButton.addEventListener('click', () => {
    socket.emit('drawResponse', true);
});
drawModalNoButton.addEventListener('click', () => {
    socket.emit('drawResponse', false, () => (drawModal.style.display = 'none'));
});
gameOverHomeButton.addEventListener('click', () => {
    socket.emit('lobby', () => console.log('Both players are redirecting back to the lobby!'));
});
gameOverRematchButton.addEventListener('click', () => {
    socket.emit('rematchRequest', () => console.log('Your rematch request was sent!'));
    gameOverHomeButton.disabled = true;
    gameOverRematchButton.disabled = true;
});
rematchYesButton.addEventListener('click', () => {
    socket.emit('rematchResponse', true);
});
rematchNoButton.addEventListener('click', () => {
    socket.emit('rematchResponse', false, () => {
        gameOverHomeButton.disabled = false;
        gameOverRematchButton.disabled = false;
        rematchModal.style.display = 'none';
    });
});

/*----------- Socket Events ----------*/
socket.on('startGame', () => {
    addClickToArsenal();
});

socket.on('updateGameData', (data) => {
    if (
        playerTurn
            ? data.move.endLocation >= 0 && data.move.endLocation <= 7
            : data.move.endLocation >= 56 && data.move.endLocation <= 63
    )
        board[data.move.startLocation].isKing = true;
    updateCells(data.piece, data.move);
    updateBoard(data.move);
    kingMoves = data.kingMoves;
    whitePlayer.arsenal = document.querySelectorAll('.white-piece');
    blackPlayer.arsenal = document.querySelectorAll('.black-piece');
});

socket.on('playerTurnChange', () => {
    changePlayerTurn();
    addClickToArsenal();
});

socket.on('recieveDrawRequest', () => {
    drawModal.firstElementChild.children[0].innerHTML =
        playerTurn === true ? `${blackPlayer.username}, DO YOU ACCEPT?` : `${whitePlayer.username}, DO YOU ACCEPT?`;
    drawModal.style.display = '';
});

socket.on('noDraw', () => {
    console.log('Your draw request was denied!');
    gameDrawButton.disabled = false;
});

socket.on('draw', () => {
    isDraw = true;
    drawModal.style.display = 'none';
    gameOver();
});

socket.on('gameOver', (resignedPlayer) => gameOver(resignedPlayer));

socket.on('backToLobby', () => {
    window.location.href = '/lobby/lobby.html';
});

socket.on('playerLeft', () => {
    gameOverRematchButton.disabled = true;
    gameOver();
});

socket.on('rematchDenied', () => {
    console.log('Your rematch request was denied!');
    gameOverHomeButton.disabled = false;
    gameOverRematchButton.disabled = false;
});

socket.on('recieveRematchRequest', () => {
    drawModal.style.display = 'none';
    rematchModal.style.display = '';
});

socket.on('newGame', () => {
    const boardElement = document.getElementById('board');
    while (boardElement.firstElementChild) boardElement.removeChild(boardElement.lastElementChild);

    const game = document.getElementById('game');
    game.removeChild(game.lastElementChild);
    game.removeChild(game.lastElementChild);

    htmlBoard();
    renderPlayers();

    board = newBoard();
    playerTurn = true;
    isGameOver = false;
    isDraw = false;
    totalPieces = 24;
    kingMoves = 0;
    allAvailbleMoves = getAllAvailbleMoves();
    whitePlayer.arsenal = document.querySelectorAll('.white-piece');
    blackPlayer.arsenal = document.querySelectorAll('.black-piece');
    playerArsenal = playerTurn ? whitePlayer.arsenal : blackPlayer.arsenal;
    cells = document.getElementById('board').children;
    cellsArray = [...cells];

    gameOverHomeButton.disabled = false;
    gameOverRematchButton.disabled = false;
    gameOverModal.style.display = 'none';
    rematchModal.style.display = 'none';
    if (currentPlayer) addClickToArsenal();
});

socket.on('playerLeft', (resignedPlayer) => {
    gameOverRematchButton.disabled;
    gameOver(resignedPlayer);
});
