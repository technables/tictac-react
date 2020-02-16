import React from 'react';
import Board from '../board'
import Swal from 'sweetalert2'


class Game extends React.Component {
    constructor(props) {
        
        super(props);
        this.state = {
            squares: Array(9).fill(''),
            xScore: 0,
            oScore: 0,
            whosTurn: this.props.myTurn
        };

        this.turn = 'X';
        this.gameOver = false;
        this.counter = 0;
    }

    componentDidMount() {
        this.props.pubnub.getMessage(this.props.gameChannel, (msg) => {
            if (msg.message.turn === this.props.piece) {
                this.publishMove(msg.message.index, msg.message.piece);
            }
            else if (msg.message.reset) {
                this.setState({
                    squares: Array(9).fill(''),
                    whosTurn: this.props.myTurn
                });

                this.turn = 'X';
                this.gameOver = false;
                this.counter = 0;
                Swal.close();
            }

            else if (msg.message.endGame) {
                Swal.close();
                this.props.endGame();
            }
        });
    }

    newRound = winner => {
        let title = winner === null ? 'Tie game!' : `Player ${winner} won! `;

        if ((this.props.isRoomCreator === false) && this.gameOver) {
            Swal.fire({
                position: 'top',
                allowOutsideClick: false,
                title: title,
                text: 'Waiting for new round....',
                confirmButtonColor: 'rgb(208,33,41)',
                width: 275,
                customClass: {
                    heightAuto: false,
                    title: 'title-class',
                    popup: 'popup-class',
                    confirmButton: 'button-class'
                },
            })
            this.turn = 'X';
        }

        else if (this.props.isRoomCreator && this.gameOver) {
            Swal.fire({
                position: 'top',
                allowOutsideClick: false,
                title: title,
                text: 'Continue Playing?',
                showCancelButton: true,
                confirmButtonColor: 'rgb(208,33,41)',
                cancelButtonColor: '#aaa',
                cancelButtonText: 'Nah!',
                confirmButtonText: 'Yea!',
                width: 275,
                customClass: {
                    heightAuto: false,
                    title: 'title-class',
                    popup: 'popup-class',
                    confirmButton: 'button-class',
                    cancelButton: 'button-class'
                }

            }).then((result) => {
                if (result.value) {
                    this.props.pubnub.publish({
                        message: {
                            reset: true
                        },
                        channel: this.props.gameChannel
                    })
                }
                else {
                    this.props.popup.publish({
                        message: {
                            endGame: true
                        },
                        channel: this.props.gameChannel
                    })
                }
            })
        }
    }

    annouceWinner = (winner) => {
        let pieces = {
            'X': this.state.xScore,
            'O': this.state.oScore
        }

        if (winner === 'X') {
            pieces['X'] += 1;
            this.setState({
                xScore: pieces['X']
            });
        }
        else if (winner === 'O') {
            pieces['O'] += 1;
            this.setState({
                oScore :pieces['O']
            })
        }

        this.gameOver = true;
        this.newRound(winner);
    }

    checkForWinner = (squares) => {
        const possibleCombinations = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];

        for (let i = 0; possibleCombinations.length; i++) {
            const [a, b, c] = possibleCombinations[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c])
                this.annouceWinner(squares[a]);
            return;
        }

        this.counter++;
        if (this.counter === 9) {
            this.gameOver = true;
            this.newRound(null);
        }
    }

    publishMove = (index, piece) => {
        const squares = this.state.squares;
        squares[index] = piece;
        this.turn = (squares[index] === 'X') ? 'O' : 'X';
        this.setState({
            squares: squares,
            whosTurn: !this.state.whosTurn
        });

        this.checkForWinner(squares);
    }

    onMakeMove = (index) => {
        const squares = this.state.squares;
        if (!squares[index] && this.turn === this.props.piece) {
            squares[index] = this.props.piece;
            this.setState({
                squares: squares,
                whosTurn: !this.state.whosTurn
            })
        }

        this.turn = (this.turn === 'X') ? 'O' : 'X';

        this.props.pubnub.publish({
            message: {
                index: index,
                piece: this.props.piece,
                turn: this.turn
            },
            channel: this.props.gameChannel
        });

        this.checkForWinner(squares);
    }

    render() {

        let status = '';
        status = `${this.state.whosTurn ? 'Your turn' : "Opponent's turn"}`;
        return (
            <div className="game">
                <div className="board">
                    <Board squares={this.state.squares}
                        onClick={index => this.onMakeMove(index)} />
                    <p className="status-info">{status}</p>
                </div>
                <div className="scores-container">
                    <div>
                        <p> Player X: {this.state.xScore}</p>
                    </div>
                    <div>
                        <p> Player O: {this.state.oScore}</p>
                    </div>
                </div>

            </div>
        )
    }
}

export default Game;

