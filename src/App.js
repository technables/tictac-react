import React, { Component } from 'react';
import Game from './component/view/game'
import Board from './component/view/board';

import './component/view/game/index.css';
import PubNubReact from 'pubnub-react';
import Swal from "sweetalert2";
import shortid from 'shortid';

class App extends Component {
  constructor(props) {
    super(props);
    this.pubnub = new PubNubReact({
      publishKey: "pub-c-1c7f5c2e-fc32-477f-8b25-9d69aad9f170",
      subscribeKey: "sub-c-aedd74ee-4f57-11ea-814d-0ecb550e9de2"
    });

    this.state = {
      piece: '',
      isPlaying: false,
      isRoomCreator: false,
      isDisabled: false,
      myTurn: false,
    };

    this.lobbyChannel = null;
    this.gameChannel = null;
    this.roomId = null;
    this.pubnub.init(this);
  }

  componentWillUnmount() {
    this.pubnub.unsubscribe({
      channels: [this.lobbyChannel, this.gameChannel]
    });
  }

  componentDidUpdate() {
    // Check that the player is connected to a channel
    if (this.lobbyChannel != null) {
      this.pubnub.getMessage(this.lobbyChannel, (msg) => {
        // Start the game once an opponent joins the channel
        if (msg.message.notRoomCreator) {
          // Create a different channel for the game
          this.gameChannel = 'tictactoegame--' + this.roomId;

          this.pubnub.subscribe({
            channels: [this.gameChannel]
          });

          this.setState({
            isPlaying: true
          });

          // Close the modals if they are opened
          Swal.close();
        }
      });
    }
  }

  // Create a room channel
  onPressCreate = (e) => {
    // Create a random name for the channel
    this.roomId = shortid.generate().substring(0, 5);
    this.lobbyChannel = 'tictactoelobby--' + this.roomId;

    this.pubnub.subscribe({
      channels: [this.lobbyChannel],
      withPresence: true
    });

    Swal.mixin({
      input: 'text',
      confirmButtonText: 'Next &rarr;',
      showCancelButton: true,
      progressSteps: ['Join', 'Choose Your Deck']
    }).queue([
      {
        title: 'Join',
        text: 'Enter Room ID'
      },
      'Choose Your Deck'
    ]).then((result) => {
      if (result.value) {
        const answers = JSON.stringify(result.value)
        Swal.fire({
          title: 'All done!',
          html: `
            Your answers:
            <pre><code>${answers}</code></pre>
          `,
          confirmButtonText: 'Lovely!'
        })
      }
    });

    // Open the modal
    // Swal.fire({
    //   position: 'top',
    //   allowOutsideClick: false,
    //   title: 'Share this room ID with your friend',
    //   text: this.roomId,
    //   width: 275,
    //   padding: '0.7em',
    //   // Custom CSS
    //   customClass: {
    //     heightAuto: false,
    //     title: 'title-class',
    //     popup: 'popup-class',
    //     confirmButton: 'button-class'
    //   }
    // })

    this.setState({
      piece: 'X',
      isRoomCreator: true,
      isDisabled: true, // Disable the 'Create' button
      myTurn: true, // Room creator makes the 1st move
    });
  }

  // The 'Join' button was pressed
  onPressJoin = (e) => {
    Swal.fire({
      position: 'top',
      input: 'text',
      allowOutsideClick: false,
      inputPlaceholder: 'Enter the room id',
      showCancelButton: true,
      confirmButtonColor: 'rgb(208,33,41)',
      confirmButtonText: 'OK',
      width: 275,
      padding: '0.7em',
      customClass: {
        heightAuto: false,
        popup: 'popup-class',
        confirmButton: 'join-button-class ',
        cancelButton: 'join-button-class'
      }
    }).then((result) => {
      // Check if the user typed a value in the input field
      if (result.value) {
        this.joinRoom(result.value);
      }
    })
  }

  // Join a room channel
  joinRoom = (value) => {
    this.roomId = value;
    this.lobbyChannel = 'tictactoelobby--' + this.roomId;

    // Check the number of people in the channel
    this.pubnub.hereNow({
      channels: [this.lobbyChannel],
    }).then((response) => {
      if (response.totalOccupancy < 2) {
        this.pubnub.subscribe({
          channels: [this.lobbyChannel],
          withPresence: true
        });

        this.setState({
          piece: 'O',
        });

        this.pubnub.publish({
          message: {
            notRoomCreator: true,
          },
          channel: this.lobbyChannel
        });
      }
      else {
        // Game in progress
        Swal.fire({
          position: 'top',
          allowOutsideClick: false,
          title: 'Error',
          text: 'Game in progress. Try another room.',
          width: 275,
          padding: '0.7em',
          customClass: {
            heightAuto: false,
            title: 'title-class',
            popup: 'popup-class',
            confirmButton: 'button-class'
          }
        })
      }
    }).catch((error) => {
      console.log(error);
    });
  }

  // Reset everything
  endGame = () => {
    this.setState({
      piece: '',
      isPlaying: false,
      isRoomCreator: false,
      isDisabled: false,
      myTurn: false,
    });

    this.lobbyChannel = null;
    this.gameChannel = null;
    this.roomId = null;

    this.pubnub.unsubscribe({
      channels: [this.lobbyChannel, this.gameChannel]
    });
  }

  render() {
    return (
      <div>
        <div className="title">
          <p>React Tic Tac Toe</p>
        </div>

        {
          !this.state.isPlaying &&
          <div className="game">
            <div className="board">
              <Board
                squares={0}
                onClick={index => null}
              />

              <div className="button-container">
                <button
                  className="create-button "
                  disabled={this.state.isDisabled}
                  onClick={(e) => this.onPressCreate()}
                > Create
                  </button>
                <button
                  className="join-button"
                  onClick={(e) => this.onPressJoin()}
                > Join
                  </button>
              </div>

            </div>
          </div>
        }

        {
          this.state.isPlaying &&
          <Game
            pubnub={this.pubnub}
            gameChannel={this.gameChannel}
            piece={this.state.piece}
            isRoomCreator={this.state.isRoomCreator}
            myTurn={this.state.myTurn}
            xUsername={this.state.xUsername}
            oUsername={this.state.oUsername}
            endGame={this.endGame}
          />
        }
      </div>
    );
  }
}

export default App;
