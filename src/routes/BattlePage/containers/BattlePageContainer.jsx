
import React , { Component } from 'react'
import { connect } from 'react-redux'
import './BattlePageContainer.scss';
import Problem from '../components/Problem'
import CountdownClock from '../components/CountdownClock'
import CodeEditor from '../../CodeEditor/components/CodeEditor'
import axios from 'axios';
import Notifications, {notify} from 'react-notify-toast';
import { browserHistory } from 'react-router';

class BattlePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //player object holds the socket id and the number of questions answered correctly
      player1: {id:'Player One', progress: 0, username: 'Player One'},
      player2: {id:'Player Two', progress: 0, username: 'Player Two'},
      //holds the question objects
      questionsArr: [],

      //the index of the questionArr
      currentQuestion: 0,

      code: '',
      results: '',
      timeElapsed: 0,
      startingTime: null,
      playerProgress: [0, 0],
      playerNumber: 0,
      numberOfQuestions: 3,
      roomID: '',
      // timeRemaining: 60,
      // prevTime: null,
      gameWon: false
    }

    this.gameWinningEmitEvent = this.gameWinningEmitEvent.bind(this);

  }

  gameWinningEmitEvent(){
    socket.emit('gameOver', {roomID: this.state.roomID, winnerID: this.state.player1.id, score: [this.state.player1.progress, this.state.player2.progress], time: this.state.timeElapsed})
  }
  componentDidMount() {
    //set the player ids to their socket ids
    //get the questions getting sent from the backend and store them in questionsArr
    let p1username = 'Player One';
    let p2username = 'Player Two';
    socket.on('sending Questions', (data) => {
      console.log('frontend data', data);
      p1username = data.player1.username;
      p2username = data.player2.username;
      this.setState({player1: {id:data.player1.socketId, progress: 0, username: p1username}, player2: {id: data.player2.socketId, progress: 0, username: p2username}, questionsArr: data.questions})
    })


    //when someone gets a question correct
    socket.on('updatePlayerScore', (data) => {
      console.log("socket data",data);
      //string will hold the player who got the question correct
      let playerToUpdate = data.playerToUpdate;
      if(playerToUpdate === 'Player1'){
        console.log("player 1 state", this.state.player1);
        //if the the clients socket ID matches the socket ID of player 1
        if(socket.id === data.currentPlayer){
          //change player 1's progress and their current question
          this.setState( {player1: {id: this.state.player1.id, progress: (this.state.player1.progress + 1), username: p1username}, currentQuestion: (this.state.currentQuestion + 1), roomID: data.roomID}, () => {

            if(this.state.player1.progress === this.state.numberOfQuestions && this.state.gameWon === false){
                notify.show('You won the game!', 'success', 2500);
                console.log("inside player 1 win check")
                socket.emit('gameOver', {roomID: this.state.roomID, winnerID: this.state.player1.id, username: p1username, score: [this.state.player1.progress, this.state.player2.progress], time: this.state.timeElapsed});

                setTimeout(() => {
                      browserHistory.push('/gameWon');
                }, 2500);
              }
            else if (this.state.player1.progress === this.state.numberOfQuestions && this.state.gameWon === true) {
                notify.show('You got all the answers! But your opponent was faster. :(', 'success', 2500);
                setTimeout(() => {
                  browserHistory.push('/gameFinished');
                }, 2500);
              }
              else {
                notify.show('You got an answer correct!', 'success', 2500);
            }
          });

          console.log('Player 1 progress updated and the question should have changed', this.state.player1.progress)
        }
        else{
          //change player 1's progress to update the score
          this.setState( {player1: {id: this.state.player1.id, progress: (this.state.player1.progress + 1), username: p1username}, roomID: data.roomID});
          console.log('Player 1 progress updated', this.state.player1.progress)

          if(this.state.player1.progress === this.state.numberOfQuestions){
            notify.show('Player 1 answered question #' + this.state.player1.progress + ' and won! You can still keep going, though :)', 'error', 2500);
          } else {
            notify.show('Player 1 submitted a correct answer to question #' + this.state.player1.progress +'!', 'warning', 2500);
          }
        }
      }
      //player must be player 2
      else{
        console.log("player 2 state",this.state.player2);
        //if the client is player 2 update their progress and change the score
        if(socket.id === data.currentPlayer){
          this.setState( {player2: {id: this.state.player2.id, progress: (this.state.player2.progress + 1), username: p2username}, currentQuestion: (this.state.currentQuestion + 1), roomID: data.roomID}, () => {
              // notify.show('Player 2 got an answer correct!', 'success', 2500);
              if(this.state.player2.progress === this.state.numberOfQuestions && this.state.gameWon === false){
                    notify.show('You won the game!', 'success', 2500);
                    console.log("inside player 2 win check")
                    //
                    socket.emit('gameOver', {roomID: this.state.roomID, winnerID: this.state.player2.id, username: p2username, score: [this.state.player1.progress, this.state.player2.progress], time: this.state.timeElapsed});
                    setTimeout(() => {
                      browserHistory.push('/gameWon');
                    }, 2500);
                }
              else if (this.state.player2.progress === this.state.numberOfQuestions && this.state.gameWon === true) {
                    notify.show('You got all the answers! But your opponent was faster. :(', 'success', 2500);
                    setTimeout(() => {
                      browserHistory.push('/gameFinished');
                    }, 2500);
                }
            else {
                    notify.show('You got an answer correct!', 'success', 2500);
                }
          });

          console.log('Player 2 progress updated and the question should have changed', this.state.player2.progress)
        }
        else{
          //just change player 2's score
          this.setState( {player2: {id: this.state.player2.id, progress: (this.state.player2.progress + 1), username: p2username}, roomID: data.roomID})
          console.log('Player 2 progress updated', this.state.player2.progress )

          if(this.state.player2.progress === this.state.numberOfQuestions){
            notify.show('Player 2 answered question #' + this.state.player2.progress + ' and won! You can still keep going, though :)', 'error', 2500);
          } else {
            notify.show('Player 2 submitted a correct answer to question #' + this.state.player2.progress +'!', 'warning', 2500);
          }
        }
      }
      console.log(`${data.playerToUpdate} has completed a question`);

    })

    //when a player fails an attempt
    socket.on('failedSub', (data) => {
      console.log(`${data.playerToUpdate} has failed an attempt because of ${data.reason}`);
    })


    socket.on('gameWinningState', (data) => {
      // alert(data.winnerID, "won");
      // notify.show(data.winnerID, " won the game!", 'success', 2500);
      this.setState({gameWon: true});
      console.log(data.winnerID, "won");
    })

  }
  render() {
    console.log("render of the container",this.state.questionsArr[this.state.currentQuestion]);
      return (
        <div className="container-fluid" id="battlePageWrapper">
          <Notifications />
          <div className="row">
            <CountdownClock />
          </div>
          <div className="row">
            <div className="col col-xs-12 col-sm-6 col-md-4 col-lg-4" id="problemsContainers">

                  {/**Passes in the users current question object to the Problem component by using ArrayOfQuestions[current question index]**/}
                <Problem CurrentQuestion={this.state.questionsArr[this.state.currentQuestion]}/>
                <h2>{`${this.state.player1.username} - ${this.state.player1.progress}`}</h2>
                <h2>{`${this.state.player2.username} - ${this.state.player2.progress}`}</h2>
              </div>
              <div className="col col-xs-12 col-sm-6 col-md-8 col-lg-8" id="codeeditor">
                <CodeEditor currentQuestionID={this.state.questionsArr[this.state.currentQuestion]} roomID={this.props.roomID.id}/>
            </div>
          </div>
      </div>
      );
    }
}

const mapStateToProps = (state) => ({roomID : state.gameLobby})

export default connect(mapStateToProps)(BattlePage);

