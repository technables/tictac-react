import React, { Component } from 'react'
import Square from '../../control/square'

class Board extends Component {

    createBoard(row, col) {
        const board = [];
        let cellCounter = 0;
        for (let i = 0; i < row; i++) {
            const columns = [];
            for (let j = 0; j < col; j++) {
                columns.push(this.renderSquare(cellCounter++));
            }
            board.push(<div key={i} className="board-row">{columns}</div>);
        }

        return board;
    }

    renderSquare(i) {
        return (
            <Square key={i}
                value={this.props.squares[i]}
                onClick={() => this.props.onClick(i)} />
        )
    }
    render() {
        return (
            <div>
                {this.createBoard(3, 3)};
            </div>
        )
    }
}

export default Board;
