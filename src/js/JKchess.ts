class JKchess {

    private boardSquares:Element[][] = [[],[],[],[],[],[],[],[]];

    constructor(target:string) {
        let targetElement = document.querySelector(target);

        if(targetElement !== null) {
            if(targetElement.childNodes.length === 0) {
                this.buildChess(target);
            }

            else {
                console.error("Target element isn't empty");
            }
        }

        else {
            console.error("Target element doesn't exists");
        }
    }

    async buildChess(target:string) {
        let chessBox = document.createElement("div");
        chessBox.id = "JKchess";

        let board = this.buildChessBoard();
        chessBox.appendChild(board);

        let targetElement = document.querySelector(target) as Element;
        targetElement.appendChild(chessBox);

        let config = await this.defaultChessPiece();

        this.setPiecesFromConfig(config);
    }

    buildChessBoard():HTMLDivElement {
        let chessBoard = document.createElement("div");
        chessBoard.id = "JKchess-board";

        for(let i = 0; i < 8; i++) {
            let row = document.createElement("div");
            row.classList.add("JKchess-row");
            chessBoard.insertAdjacentElement("afterbegin" ,row);

            for(let j = 0; j < 8; j++) {
                let column = document.createElement("div");
                column.classList.add("JKchess-column");
                row.appendChild(column);
                this.boardSquares[j][i] = column
            }
        }
        return chessBoard;
    }

    async defaultChessPiece() {
        let defaultConfig = await fetch("/src/config/default.json");
        defaultConfig = await defaultConfig.json();
        return defaultConfig;
    }

    setPiecesFromConfig(config) {
        for (const piece of config) {
            if(this.boardSquares[piece.position.x][piece.position.y].childNodes.length === 0) {
                let pieceElement = document.createElement("span");
                pieceElement.classList.add("figure");
                pieceElement.dataset.jkchessFigureType = piece.type;
                pieceElement.dataset.jkchessFigureColor = piece.color;

                this.boardSquares[piece.position.x][piece.position.y].appendChild(pieceElement);
            }

            else {
                console.error("Wrong configuration")
            }
        }
    }
}