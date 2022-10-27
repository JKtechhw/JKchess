class JKchess {
    private chessBox;
    private chessBoard;
    private boardSquares:HTMLSpanElement[][] = [[]]; //[row][column]
    private pieces:any[] = [];
    private activeColor;

    constructor(target:string) {
        let targetElement = document.querySelector(target);

        //Check if target element exists
        if(targetElement !== null) {
            //Check if target element is empty
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
        this.chessBox = document.createElement("div");
        this.chessBox.id = "JKchess";

        this.chessBoard = this.buildChessBoard();
        this.chessBox.appendChild(this.chessBoard);
        
        //Insert chess element to target element
        let targetElement = document.querySelector(target) as Element;
        targetElement.appendChild(this.chessBox);

        //Load default config
        let config = await this.defaultChessPiece();
        //Apply pieces from config
        this.setPiecesFromConfig(config);
        //White player is starting
        this.activeColor = "white";
    }

    buildChessBoard(rows:number = 8, columns:number = 8):HTMLDivElement {
        //Create board element
        let chessBoard = document.createElement("div");
        chessBoard.id = "JKchess-board";

        for(let rowIndex = 0; rowIndex < rows; rowIndex++) {
            let row = document.createElement("div");
            row.classList.add("JKchess-row");
            //Set row name as dataset
            row.dataset.jkchessRowName = (rowIndex + 1).toString();
            //Insert row to chessboard element
            chessBoard.insertAdjacentElement("afterbegin", row);
            //Create array for squares
            this.boardSquares.push([]);

            for(let columnIndex = 0; columnIndex < columns; columnIndex++) {
                let column = document.createElement("div");
                column.classList.add("JKchess-column");
                //If row is first or last add column name
                rowIndex === 0 || rowIndex === rows - 1 ? column.dataset.jkchessColumnName = String.fromCharCode(65 + columnIndex) : null;
                row.appendChild(column);
                //Add column to squares array
                this.boardSquares[rowIndex].push(column);
            }
        }
        //Remove last empty array
        this.boardSquares.pop();
        return chessBoard;
    }

    async defaultChessPiece() {
        try {
            //Fetch default config
            let defaultConfig = await fetch("/src/config/default.json");
            //Parse config to JSON
            defaultConfig = await defaultConfig.json();
            return defaultConfig;
        }

        catch(e) {
            console.error(e);
            return false;
        }
    }

    setPiecesFromConfig(config) {
        //Remove all pieces from array
        this.pieces = [];
        let exisstingPieces = this.chessBoard.querySelectorAll(".JKchess-piece");
        for(const piece of exisstingPieces) {
            //Remove existing piece elements
            piece.remove();
        }

        for (const piece of config) {
            //Check if square is empty
            if(this.boardSquares[piece.position.row][piece.position.column].childNodes.length === 0) {
                let pieceElement = document.createElement("span");
                pieceElement.classList.add("JKchess-piece");
                pieceElement.dataset.jkchessFigureType = piece.type;
                pieceElement.dataset.jkchessFigureColor = piece.color;
                this.boardSquares[piece.position.row][piece.position.column].appendChild(pieceElement);
                piece["element"] = pieceElement;
                this.pieces.push(piece);

                pieceElement.addEventListener("mousedown", (e) => {
                    this.changePiecePosition(piece, e);
                });
            }

            else {
                console.error("There is another piece on this position");
            }
        }
    }

    changePiecePosition(piece, event:MouseEvent) {
        if(piece.color !== this.activeColor) {
            console.log(`${piece.color} can't play now`);
            return;
        }

        this.clearActiveSquares();
        let possibleSquares = this.getPiecePositions(piece);
        this.setActiveSquares(possibleSquares);
        
        let originalSquare = piece.element.parentElement;
        let pieceSize = this.chessBoard.querySelector(".JKchess-column").getBoundingClientRect();
        let boardOffset = this.chessBoard.getBoundingClientRect();
        let mousemoveEvent = (e:MouseEvent) => {
            piece.element.style.left = (e.clientX - boardOffset.left) + "px";
            piece.element.style.top = (e.clientY - boardOffset.top) + "px";
        }

        mousemoveEvent(event);

        //Style piece element before manipulation 
        this.chessBoard.classList.add("JKchess-manipulation");
        piece.element.style.width = (pieceSize.width) + "px";
        piece.element.style.height = (pieceSize.height) + "px";
        piece.element.classList.add("JKchess-figure-manipulation");

        //Insert piece element before end of chessboard
        this.chessBoard.insertAdjacentElement("beforeend", piece.element);

        this.chessBoard.addEventListener("mousemove", mousemoveEvent);
        document.addEventListener("mouseup", (e) => {
            //Remove mousemove event
            this.chessBoard.removeEventListener("mousemove", mousemoveEvent);
            //Remove manipulation styles
            this.chessBoard.classList.remove("JKchess-manipulation");
            piece.element.classList.remove("JKchess-figure-manipulation");
            piece.element.style.width = "";
            piece.element.style.height = "";

            let newSquare = document.elementFromPoint(e.clientX, e.clientY) as HTMLSpanElement | null;

            if(newSquare !== null && originalSquare !== null) {
                //Check if new element if same as original
                if(newSquare === originalSquare) {
                    newSquare.appendChild(piece.element);
                    return;
                }

                //Check if 
                if(newSquare?.classList.contains("JKchess-piece")) {
                    if(newSquare.dataset.jkchessFigureColor !== piece.color) {
                        console.log(`${piece.color} is removing ${newSquare.dataset.jkchessFigureColor} ${newSquare.dataset.jkchessFigureType}`);
                        newSquare = newSquare.parentElement as HTMLDivElement;
                        newSquare.childNodes[0].remove();
                    }

                    else {
                        originalSquare.appendChild(piece.element);
                        return;
                    }
                }

                if(newSquare?.classList.contains("JKchess-column")) {
                    newSquare?.appendChild(piece.element);
                    const row = this.boardSquares.findIndex(row => row.includes(newSquare as HTMLSpanElement));
                    const col = this.boardSquares[row].indexOf(newSquare);
                    piece.position = {"row": row, "column": col};

                    this.clearActiveSquares();
                    this.switchActiveColor();
                }

            }
            
        }, {once: true});
    }

    switchActiveColor() {
        if(this.activeColor === "white") {
            this.activeColor = "black";
            console.log("Now playing black");
        }

        else {
            this.activeColor = "white";
            console.log("Now playing white");
        }
    }

    getPiecePositions(piece) {
        let possiblePositions:any = [];
        if(piece.type === "pawn") {
            if(piece.position.row === 1) {
                let firstPosition = {"row": piece.position.row + 1, "column": piece.position.column};
                this.checkSquareStatus(piece.position.row + 1, piece.position.column) ? possiblePositions.push(firstPosition) : null;

                let secondPosition = {"row": piece.position.row + 2, "column": piece.position.column};
                possiblePositions.push(secondPosition);
            }

            else {
                let firstPosition = {"row": piece.position.row + 1, "column": piece.position.column};
                possiblePositions.push(firstPosition);
            }

            //Top left position
            if(piece.position.row + 1 < this.boardSquares.length && piece.position.column - 1 >= 0) {
                let removeLeft = this.boardSquares[piece.position.row + 1][piece.position.column - 1];
                if(removeLeft.childNodes.length > 0) {
                    let removeLeftPosition = {"row": piece.position.row + 1, "column": piece.position.column - 1};
                    possiblePositions.push(removeLeftPosition);
                }
            }

            //Top right position
            if(piece.position.row + 1 < this.boardSquares.length && piece.position.column + 1 < this.boardSquares[0].length) {
                let removeRight = this.boardSquares[piece.position.row + 1][piece.position.column + 1];
                if(removeRight.childNodes.length > 0) {
                    let removeRightPosition = {"row": piece.position.row + 1, "column": piece.position.column + 1};
                    possiblePositions.push(removeRightPosition);
                }
            }
        }

        else if (piece.type === "rook") {
            for(let i = 0; i < this.boardSquares.length; i++) {
                let rowPosition = {"row": i, "column": piece.position.column};
                possiblePositions.push(rowPosition);
            }

            for(let i = 0; i < this.boardSquares.length; i++) {
                let columnPosition = {"row": piece.position.row, "column": i};
                possiblePositions.push(columnPosition);
            }
        }

        else if (piece.type === "bishop") {
            let shift = Math.abs(piece.position.column - piece.position.row);
            let firstPosition;
            if(piece.position.column > piece.position.row) {
                firstPosition = {"column": shift, "row": 0};
            }

            else {
                firstPosition = {"column": 0, "row": shift};
            }

            console.log(shift);

            //Left to right
            for(let i = 0; firstPosition.column + i < this.boardSquares.length && firstPosition.row + i < this.boardSquares.length; i++) {
                let columnPosition = {"column": firstPosition.column + i, "row": firstPosition.row + i};
                possiblePositions.push(columnPosition);
            }
        }

        else if (piece.type ==="knight") {
            //Top right
            if(piece.position.row + 2 <= this.boardSquares.length && piece.position.column + 1 <= this.boardSquares[0].length) {
                let position = {"row": piece.position.row + 2, "column": piece.position.column + 1};
                possiblePositions.push(position);
            }

            if(piece.position.row + 1 <= this.boardSquares.length && piece.position.column + 2 <= this.boardSquares[0].length) {
                let position = {"row": piece.position.row + 1, "column": piece.position.column + 2};
                possiblePositions.push(position);
            }

            //Top left
            if(piece.position.row + 2 <= this.boardSquares.length && piece.position.column - 1 >= 0) {
                let position = {"row": piece.position.row + 2, "column": piece.position.column - 1};
                possiblePositions.push(position);
            }

            if(piece.position.row + 1 <= this.boardSquares.length && piece.position.column - 2 >= 0) {
                let position = {"row": piece.position.row + 1, "column": piece.position.column - 2};
                possiblePositions.push(position);
            }

            //Bottom right
            if(piece.position.row - 2 >= 0 && piece.position.column + 1 <= this.boardSquares[0].length) {
                let position = {"row": piece.position.row - 2, "column": piece.position.column + 1};
                possiblePositions.push(position);
            }

            if(piece.position.row - 1 >= 0 && piece.position.column + 2 <= this.boardSquares[0].length) {
                let position = {"row": piece.position.row - 1, "column": piece.position.column + 2};
                possiblePositions.push(position);
            }

            //Bottom left
            if(piece.position.row - 2 >= 0 && piece.position.column - 1 >= 0) {
                let position = {"row": piece.position.row - 2, "column": piece.position.column - 1};
                possiblePositions.push(position);
            }

            if(piece.position.row - 1 >= 0 && piece.position.column - 2 >= 0) {
                let position = {"row": piece.position.row - 1, "column": piece.position.column - 2};
                possiblePositions.push(position);
            }
        }

        else if (piece.type === "king") {

        }

        return possiblePositions;
    }

    checkSquareStatus(row:number, column:number):boolean {
        if(row < this.boardSquares.length && column < this.boardSquares[0].length) {
            let targetPiece = this.pieces.find(piece => {
                return piece.position.row === row && piece.position.column === column
            });

            if(targetPiece) {
                if(targetPiece.color === this.activeColor) {
                    return false;
                }
            }

            return true;
        }

        else {
            console.error("Square is out of range");
            return false;
        }
    }

    clearActiveSquares() {
        let oldActives = this.chessBox.querySelectorAll(".JKchess-column.JKchess-active");
        oldActives.forEach(element => {
            element.classList.remove("JKchess-active");
        });
    }


    setActiveSquares(possiblePositions) {
        for (const position of possiblePositions) {
            this.boardSquares[position.row][position.column].classList.add("JKchess-active");
        }

    }
}