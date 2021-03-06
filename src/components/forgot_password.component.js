import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Logo from "../images/LearnLogo.png";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import {api} from "../axios_api.js";
import Navbar from "./navbar.component";
import jwt from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash} from "@fortawesome/free-regular-svg-icons";
require('dotenv').config();

export let myObject = {value: ""};

export default class ForgotPassword extends Component {
    constructor(props){
        super(props);


        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.toggle_password_vis = this.toggle_password_vis.bind(this);

        this.state= {
            identifier: '',
            security_question: '',
            secuity_answer: '',
            new_password: '',
            confirm_password: '',
            showModal: false,
            showAlert1: false,
            showAlert2: false,
            showAlert3: false
        }
    }

    componentDidMount(){
        var token = localStorage.getItem('usertoken');
        var validToken = false;
        if(token){
            //Token in session storage
            jwt.verify(token, process.env.REACT_APP_SECRET, function(err,res) {
                if(err){
                    //Improper JWT format 
                    localStorage.removeItem('usertoken');
                }
                else{
                    //Properly formatted JWT
                    validToken = true;
                }});
        }
        if(validToken){
            //Check if ID is in token and ID exists as a user
            const decoded = jwt_decode(token);
            if (decoded._id){
                //ID exists in token
                //Check if ID exists as a user
                api.get('/user/getSpecificUser/'+ decoded._id)
                .then(response => {
                    if (response) {
                        //Valid user
                        this.props.history.push(`/dashboard`);
                    }
                    else{
                        //Fake ID...
                        localStorage.removeItem('usertoken');
                    }
                })
                .catch(err => console.log("User Error: " + err));
            }
        }  
        else{
            //Not a Valid Token
            localStorage.removeItem('usertoken');
        }
    }

    onChange(e) {
        this.setState({[e.target.name]: e.target.value, showAlert1: false, showAlert2: false, showAlert3: false, showAlert4: false});
    }

    onSubmit(e) {
        e.preventDefault();

        api.get('/user/getSecurityQuestion/'+this.state.identifier)
        .then((response) => {
          if (response.data.length > 0){
            this.setState({
                showModal: true,
                security_question: response.data[0].security_question
            })
          }
          else{
            this.setState({
                showAlert1: true
            })
          }
        }, (error) => {
            console.log(error);
        });  

        
    }

    handleClose(e) {
        this.setState({
            showModal: false
        })
    }
    
    handleSubmit(e) {
        if (this.state.new_password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/) === null){
            this.setState({
                showAlert3: true
            })
            return
        }
        
        //Checking if fields are blank does not work for some reason
        else if (this.state.new_password !== this.state.confirm_password || this.state.security_answer.length === 0 || this.state.new_password.length === 0 || this.state.confirm_password.length === 0){
            this.setState({
                showAlert2: true
            })
            return
        }
        const sq = {
            security_answer: this.state.security_answer
        }

        api.post('/user/compareSecurityAnswer/'+this.state.identifier, sq)
        .then((response) => {
            if (response.data.answer === true) {
                api.post('/user/updatePassword/'+this.state.identifier, {
                    password: this.state.new_password
                })
                .then((response) => {
                    myObject.value = "You successfully changed your password."
                    this.props.history.push("/login")
                }, (error) => {
                    console.log(error);
                })
            }
            else{
                this.setState({
                    showAlert4: true
                })
            }
     
        }, (error) => {
            console.log(error);
        }); 
    }


    toggle_password_vis(id){
        var input = document.getElementById(id);
        if(input.type === 'password'){
            input.type = 'text';
        }
        else{
            input.type = 'password';
        }
    }

    render() {
        return (
                <div>
                    <Navbar/>
                <div className ="container" style={{background: "rgb(59, 59, 59)"}}>
                    <div className = "row" style={{border: "0px"}}>
                        <div className = "custom_col-md-6 mt-5 mx-auto" style={{width: "50%", minWidth: "405px"}}>
                            <div style = {{backgroundColor: "white", padding: "0px 20px 20px 20px", borderStyle: "solid", borderRadius: "28px", fontSize: "25px"}}> 
                                <div style = {{textAlign: "center", color: 'rgb(0, 219, 0)', width: "max-content", margin: "auto", fontSize: "55px", padding: "3px"}}>
                                    <Link to="/" className="navbar-brand">
                                        <img width = {60} src = {Logo} alt =""/>
                                    </Link>
                                    Learnosity
                                </div>
                                <div className = "form-group" style={{marginLeft: "10%"}}>
                                    <label style = {{color: "black"}}> Identifier:</label>
                                    <input type = "username" style = {{width: "90%", borderColor: "black"}} className = "form-control" name = "identifier" placeholder = "Username or Email" value = {this.state.identifier} onChange = {this.onChange} required/>
                                </div>
                                <button onClick={this.onSubmit} style = {{margin: "auto", marginTop: "10px", display: "block", backgroundColor: "limegreen", fontSize: "25px", borderStyle: "solid", borderRadius: "20px", borderColor: "grey", borderWidth: "1px", width: "45%", paddingBottom: "1.5%", paddingTop: "0.5%", color: "white"}}>
                                    Continue
                                </button>
                                <Modal
                                show={this.state.showModal}
                                onHide={this.handleClose}
                                backdrop="static"
                                keyboard={false}>
                                <Modal.Header closeButton>
                                <Modal.Title style={{width: "100%", textAlign: "center"}}>Change Password</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                <div className = "form-group" style={{marginLeft: "10%"}}>
                                    Security Question:
                                    <br></br>
                                    <div style={{border: '1px', borderColor: 'black', width: '90%', borderStyle: 'solid', borderRadius: '.25rem', height: 'auto', paddingTop: '5px', paddingLeft: '5px'}}>
                                        {this.state.security_question}
                                    </div>
                                </div>
                                <div className = "form-group" style={{marginLeft: "10%"}}>
                                    <label style = {{color: "black"}}> Security Answer:</label>
                                    <div style={{display: "flex"}}>
                                        <input id="security_answer" type = "password" style = {{width: "90%", borderColor: "black"}} className = "form-control" name = "security_answer" placeholder = "Enter Security Answer" value = {this.state.security_answer} onChange = {this.onChange} required/>
                                        <button onClick = {() => this.toggle_password_vis("security_answer")} style={{border: "transparent", background: "transparent", transform: "translate(-35px)"}}><FontAwesomeIcon icon={faEyeSlash} /></button>
                                    </div>
                                </div>
                                <div className = "form-group" style={{marginLeft: "10%"}}>
                                    <label style = {{color: "black"}}> New Password:</label>
                                    <div style={{display: "flex"}}>
                                        <input id="new_password" type = "password" style = {{width: "90%", borderColor: "black"}} className = "form-control" name = "new_password" placeholder = "New Password" value = {this.state.new_password} onChange = {this.onChange} required/>
                                        <button onClick = {() => this.toggle_password_vis("new_password")} style={{border: "transparent", background: "transparent", transform: "translate(-35px)"}}><FontAwesomeIcon icon={faEyeSlash} /></button>
                                    </div>
                                </div>
                                <div className = "form-group" style={{marginLeft: "10%"}}>
                                    <label style = {{color: "black"}}> Confirm Password:</label>
                                    <div style={{display: "flex"}}>
                                        <input id="confirm_password" type = "password" style = {{width: "90%", borderColor: "black"}} className = "form-control" name = "confirm_password" placeholder = "Confirm Password" value = {this.state.confirm_password} onChange = {this.onChange} required/>
                                        <button onClick = {() => this.toggle_password_vis("confirm_password")} style={{border: "transparent", background: "transparent", transform: "translate(-35px)"}}><FontAwesomeIcon icon={faEyeSlash} /></button>
                                    </div>
                                </div>
                                <Alert style={{textAlign: "center"}} show = {this.state.showAlert2} variant = 'danger'>
                                The passwords do not match or a field is blank.
                                </Alert>
                                <Alert style={{textAlign: "center"}} show = {this.state.showAlert3} variant = 'danger'>
                                The password must contain at least 8 characters, one uppercase, one lowercase, and one number.
                                </Alert>
                                <Alert style={{textAlign: "center"}} show = {this.state.showAlert4} variant = 'danger'>
                                The security answer is incorrect.
                                </Alert>
                                </Modal.Body>
                                <Modal.Footer>
                                <Button variant="secondary" onClick={this.handleClose}>
                                    Close
                                </Button>
                                <Button variant="primary" onClick={this.handleSubmit}>Change</Button>
                                </Modal.Footer>
                            </Modal>
                            <br></br>
                            <Alert show = {this.state.showAlert1} variant = 'danger'>
                                The entered username or email does not exist in the database.
                            </Alert>
                            </div>
                        </div>
                    </div>
                </div>
                </div>      
        )
    }
}