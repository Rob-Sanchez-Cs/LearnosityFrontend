import React, { Component } from 'react';
import {api} from "../axios_api.js";
import jwt from 'jsonwebtoken';
import { Link } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import ProgressBar from 'react-bootstrap/ProgressBar';
import {DragDropContext} from 'react-beautiful-dnd';
import {Droppable} from 'react-beautiful-dnd';
import {Draggable} from 'react-beautiful-dnd';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag, faCheckCircle, faTimesCircle } from "@fortawesome/free-regular-svg-icons";
import Timer from "./timer.component";


require('dotenv').config();

export default class PreviewCategory extends Component {
    constructor(props){
        super(props);

        this.continueButton = this.continueButton.bind(this);
        this.shuffleArray = this.shuffleArray.bind(this);
        this.submitMC = this.submitMC.bind(this);
        this.submitFIB = this.submitFIB.bind(this);
        this.removeClass = this.removeClass.bind(this);
        this.handleOnDragEnd = this.handleOnDragEnd.bind(this);
        this.submitMatching = this.submitMatching.bind(this);
        this.startTimer = this.startTimer.bind(this);
        this.timer_finished = this.timer_finished.bind(this);
        this.timer_answer = this.timer_answer.bind(this);
        this.missed_answers = this.missed_answers.bind(this);
        this.escFunction = this.escFunction.bind(this);

        this.state = {
            user_id: '',
            username: '',
            cat_id:'',
            platData_id: '',
            catData_id:'',
            pageIndex: '',
            allPages:'',
            filterPages: '',
            currentPage: '',
            progressVal: 0,
            progressIncrement: 0,
            completedCategory: false,
            submittedAnswer: false,
            shouldShuffle: true,
            current_mc_array: [],
            submitted_answer_bool: false,
            submitted_fib_correct: '',
            segmented: [],
            matching_pairs_values: [],
            matching_pairs_answered: [],
            platformFormat: '',
            categoryName :'',
            clock: '',
            timer_answers: [],
            user_timer_answers: [],
            clock_started: false,
            clock_finished: false,
            status: ''
        }
    }

    componentWillUnmount(){
        document.removeEventListener("keydown", this.escFunction, false);
    }


    missed_answers(){
        var users_answers = this.state.user_timer_answers;
        var all_answers = this.state.timer_answers;
        var missed_answers = [];
        for(let i = 0; i < all_answers.length; i++){
            var answer = all_answers[i];
            if(!users_answers.includes(answer)){
                missed_answers.push(answer);
            }
        }
        missed_answers = missed_answers.join(', ');

        return(
            <div style={{fontSize: "25px", marginLeft: "2%", marginRight: "2%", color: "black"}}>
                {missed_answers}
            </div>
        )
    }


    timer_answer(){
        var input = document.getElementById("timer_answer_input");
        var answer = input.value.toLowerCase();
        if(answer === ' '){
            input.value = '';
            return;
        }
        var correct_answers = this.state.timer_answers;
        var users_answers = this.state.user_timer_answers;
        var add_to_user_timer_answers = [];
        var answered_correctly = false;
        for(var i = 0; i < correct_answers.length; i++){
            var whole_string = correct_answers[i];
            //separate will split the answer by spaces and grab the last string in the array
            var separate = whole_string.split(" ");
            separate = separate[separate.length - 1];
            if((answer === whole_string.toLowerCase() || answer === separate.toLowerCase()) && !users_answers.includes(whole_string)){
                //Correct answer... add_to_user_timer_answers
                add_to_user_timer_answers.push(whole_string);
                answered_correctly = true;
            }
        }
        if(answered_correctly){
            //Set state and clear input value
            input.value = '';
            users_answers = users_answers.concat(add_to_user_timer_answers)
            var completed = false;
            if(users_answers.length === correct_answers.length){
                completed = true;
            }
            this.setState({user_timer_answers: users_answers, clock_finished: completed})
        }
    }

    escFunction(event){
        if(event.keyCode === 27) {
            this.props.history.push("/editCategory/" + this.state.plat_id+ "/"+this.state.cat_id)
        }
      }

    componentDidMount(){
        document.addEventListener("keydown", this.escFunction, false);

        var token = localStorage.getItem('usertoken');
        var validToken = false;
        if(token){
            //Token in session storage
            jwt.verify(token, process.env.REACT_APP_SECRET, function(err,res) {
                if(err){
                    //Improper JWT format 
                    //Remove token and redirect back to home
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
                        var user_id = response.data._id;

                        var platform_format_id = this.props.location.pathname.substring(13,37);

                        var category_format_id = this.props.location.pathname.substring(38);

                        
                        // var plat_id = this.props.location.pathname.substring(13,37);
                        api.get('/categoryFormat/getSpecificCategoryFormat/'+category_format_id)
                        .then(response => {
                            //Successfully received pages_array
                            var cat_name = response.data[0].category_name
                            var pages_array = response.data[0].pages;

                            api.post('/pageFormat/getAllPages',{pages_id: pages_array})
                            .then(response => {
                                var page_info_arr = response.data;
                              
                                var current_page = page_info_arr[0]

                                var arr = []
                                if(current_page.type === "Multiple Choice")
                                {
                                    arr = current_page.multiple_choices.slice();
                                    arr.push(current_page.multiple_choice_answer);
                                    arr = this.shuffleArray(arr);
                                }

                                var segmented = [];
                                if(current_page.type === "Fill in the Blank"){
                                    var prompt = current_page.fill_in_the_blank_prompt;
                                    var blank_maps = current_page.fill_in_the_blank_answers;
                                    var map_keys = Object.keys(blank_maps).sort((a, b) => (parseInt(a) > parseInt(b)) ? 1 : -1);
                                    var curr = 0;
                                    for(var i = 0; i < map_keys.length; i++){
                                        let index = parseInt(map_keys[i]);
                                        if(i == 0){
                                            segmented.push(prompt.substring(curr, index).trim() + " ");
                                        }
                                        else{
                                            segmented.push(" " + prompt.substring(curr, index).trim() + " ");
                                        }
                                        segmented.push(blank_maps[index]);
                                        curr = index;
                                    }
                                    segmented.push(" " + prompt.substring(curr).trim());
                                    //Have correctly segmented array (even index ==> prompt , odd index ==> blank)
                                
                                }

                                var matching_values;
                                var matching_pairs_answered;
                                if(current_page.type === "Matching"){
                                    var matching_pairs = current_page.matching_pairs;
                                    matching_values = this.shuffleArray(Object.values(matching_pairs));
                                    matching_pairs_answered = new Array(matching_values.length).fill("");
                                }

                                var seconds;
                                var minutes;
                                var timer_answers;
                                if(current_page.type === "Timer"){
                                    let clock = current_page.clock;
                                    minutes = Math.floor(clock/60);
                                    seconds = clock % 60;
                                    timer_answers = current_page.timer_answers;
                                }

                                this.setState({seconds: seconds, minutes: minutes, timer_answers: timer_answers,matching_pairs_answered: matching_pairs_answered, matching_pairs_values: matching_values, current_mc_array: arr, segmented: segmented, allPages:page_info_arr, pageIndex: 0,progressIncrement: (1/page_info_arr.length) *100, currentPage: current_page, progressVal:0,plat_id:platform_format_id,cat_id:category_format_id,categoryName:cat_name})
                            })
                            .catch(error => console.log(error.response));
                        })
                        .catch(err => console.log("Error receiving category format pages array: " + err));
                    }
                    else{
                        //Fake ID...
                        localStorage.removeItem('usertoken');
                        this.props.history.push(`/`);
                    }
                })
                .catch(err => console.log("User Error: " + err));
            }
        }  
        else{
            //Not a Valid Token
            localStorage.removeItem('usertoken');
            this.props.history.push(`/`);
        }


    }

    continueButton(){
        
        var current_page = this.state.currentPage;
        //Resetting visual displays
        if(current_page.type === "Multiple Choice"){
            var button = document.getElementsByClassName("mc_button_submitted")[0];
            button.classList.remove('mc_button_submitted');
            button.classList.add('mc_button');
        }
        else if(current_page.type === "Fill in the Blank"){
            document.getElementsByClassName("continue_button_correct")[0].style.display = 'inline';
            var blanks = document.getElementsByClassName("blank");
            for(let i = 0; i < blanks.length; i++){
                blanks[i].disabled = false;
                blanks[i].value = '';
            }
            var checks = document.getElementsByClassName("check_mark");
            for(let i = 0; i < checks.length; i++){
                checks[i].style.display = "none";
            }
            var wrongs = document.getElementsByClassName("wrong_mark");
            for(let i = 0; i < wrongs.length; i++){
                wrongs[i].style.display = "none";
            }
        }
        else if(current_page.type === "Matching"){
            document.getElementsByClassName("continue_button_correct")[0].style.display = 'inline';
            document.getElementById("matching_bottom").style.marginTop = '2%';
            
            var checks = document.getElementsByClassName("check_mark");
            for(let i = 0; i < checks.length; i++){
                checks[i].style.display = "none";
            }
            var wrongs = document.getElementsByClassName("wrong_mark");
            for(let i = 0; i < wrongs.length; i++){
                wrongs[i].style.display = "none";
            }
            for(let i = 0; i < this.state.matching_pairs_answered.length; i++){
                document.getElementById("matching_correct"+i).style.display = 'none';
            }
        }
    
        var completed_category = false;
        var current_mc_array = [];
        var segmented = [];
        var matching_values;
        var matching_pairs_answered;
        var seconds;
        var minutes;
        var timer_answers;
        if(this.state.pageIndex + 1 >= this.state.allPages.length){
            completed_category = true;
            //set the categoryData is_completed to true in database
            
            //once completed we need to score accuracy 
            const val = {
                user_id : this.state.user_id,
                cat_id : this.state.cat_id
            }

        }
        else{
            current_page = this.state.allPages[this.state.pageIndex + 1];

            if(current_page.type === "Multiple Choice"){
                if(this.state.allPages.length !== 0){
                    current_mc_array = current_page.multiple_choices.slice();
                    current_mc_array.push(current_page.multiple_choice_answer);
                    current_mc_array = this.shuffleArray(current_mc_array);
                }
            }

            else if(current_page.type === "Fill in the Blank"){
                if(this.state.allPages.length !== 0){
                    var prompt = current_page.fill_in_the_blank_prompt;
                    var blank_maps = current_page.fill_in_the_blank_answers;
                    var map_keys = Object.keys(blank_maps).sort((a, b) => (parseInt(a) > parseInt(b)) ? 1 : -1);
                    var curr = 0;
                    for(var i = 0; i < map_keys.length; i++){
                        let index = parseInt(map_keys[i]);
                        if(i === 0){
                            segmented.push(prompt.substring(curr, index).trim() + " ");
                        }
                        else{
                            segmented.push(" " + prompt.substring(curr, index).trim() + " ");
                        }
                        segmented.push(blank_maps[index]);
                        curr = index;
                    }
                    segmented.push(" " + prompt.substring(curr).trim());
                }
            }
            else if(current_page.type === "Matching"){
                if(this.state.allPages.length !== 0){
                    var matching_pairs = current_page.matching_pairs;
                    matching_values = this.shuffleArray(Object.values(matching_pairs));
                    matching_pairs_answered = new Array(matching_values.length).fill("");
                }
            }
            else if(current_page.type === 'Timer'){
                if(this.state.allPages.length !== 0){
                    let clock = current_page.clock;
                    minutes = Math.floor(clock/60);
                    seconds = clock % 60;
                    timer_answers = current_page.timer_answers;
                }
            }
        }

        this.setState({seconds: seconds, minutes: minutes, timer_answers: timer_answers, matching_pairs_answered: matching_pairs_answered, matching_pairs_values: matching_values, shouldShuffle: true, current_mc_array: current_mc_array, progressVal:this.state.progressVal + this.state.progressIncrement, pageIndex: this.state.pageIndex + 1, completedCategory: completed_category, currentPage: current_page,segmented:segmented,submittedAnswer:false,submitted_fib:""});
    }

    shuffleArray(array) {
        var shuffled_arr = array.slice();
        for (var i = shuffled_arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled_arr[i];
            shuffled_arr[i] = shuffled_arr[j];
            shuffled_arr[j] = temp;
        }
        return shuffled_arr;
    }

    submitMC(val, index) {
        //check if platform has been completed 

        //check if answer submitted is correct 
        var submitted_answer_bool = false;
        if(val === this.state.currentPage.multiple_choice_answer){
            submitted_answer_bool = true;
        }
        document.getElementById("mc"+index,).classList.remove("mc_button");
        document.getElementById("mc"+index,).classList.add("mc_button_submitted");

        this.setState({submittedAnswer:true, shouldShuffle: false, submitted_answer_bool: submitted_answer_bool});
    }

    removeClass(index){
        document.getElementById("fib"+index).placeholder = "Fill in the blank";
        document.getElementById("fib"+index).classList.remove("red_place_holder");
        let id = "ast"+ index;
        document.getElementById(id).style.display = 'none';
    }

    submitFIB(){
        var segmented = this.state.segmented;
        var all_inputs = [];
        var not_valid = false;
        for(let i = 0; i < segmented.length;i++){
            if(i % 2 !== 0){
                if(!document.getElementById("fib"+i).validity.valid){
                    document.getElementById("fib"+i).placeholder = "This Field is Required!";
                    document.getElementById("fib"+i).classList.add("red_place_holder");
                    let id = "ast"+ i;
                    document.getElementById(id).style.display = 'inline';
                    not_valid = true;
                }
            }
        }
        if(not_valid){
            return;
        }
        document.getElementsByClassName("continue_button_correct")[0].style.display = 'none';
        for(let i = 0; i < segmented.length;i++){
            if(i % 2 !== 0){
                //Grab document at id = "fib"+i
                all_inputs.push(document.getElementById("fib"+i).value.toLowerCase().trim());
                document.getElementById("fib"+i).disabled = "true";
            }
        }
        //All_inputs now has the user's values
        var correct_vals = Object.values(this.state.currentPage.fill_in_the_blank_answers);
        var users_correct = [];
        for(let i = 0; i < correct_vals.length; i++){
            users_correct.push(correct_vals[i].toLowerCase() === all_inputs[i]);
        }

        //Users_correct has array of True/False of their answers
        var total_correct = 0;
        for(let i = 0; i < users_correct.length; i++){
            var id;
            if(users_correct[i]){
                //Display correct checkmark
                id = "check"+((i*2)+1);
                total_correct += 1;
                document.getElementById(id).style.display = 'inline';
            }
            else{
                //Display incorrect mark
                id = "wrong"+((i*2)+1);
                document.getElementById(id).style.display = 'inline';
            }
        }
        var submitted_fib = '';
        if(total_correct === users_correct.length){
            submitted_fib = 'correct';
        }
        else if(total_correct / users_correct.length >= 0.5){
            submitted_fib = 'almost';
        }
        else{
            submitted_fib = 'incorrect';
        }
        
        this.setState({submittedAnswer: true, submitted_fib: submitted_fib})
    }

    submitMatching(){
        var users_answers = this.state.matching_pairs_answered;
        var not_valid = false;
        for(let i = 0; i < users_answers.length;i++){
            if(users_answers[i] === ""){
                let id = "ast_matching"+ i;
                document.getElementById(id).style.display = 'inline';
                document.getElementById(id).style.marginLeft = '375%';
                document.getElementById(id).style.maxHeight = '22px';
                document.getElementById("matching_required").style.display = 'block';
                not_valid = true;
            }
        }
        if(not_valid){
            return;
        }
        document.getElementsByClassName("continue_button_correct")[0].style.display = 'none';
        var map = this.state.currentPage.matching_pairs;
        var keys = Object.keys(map);
        var users_correct = [];
        for(let i = 0; i < users_answers.length; i++){
            users_correct.push(map[keys[i]] === users_answers[i]);
        }
   
        //Users_correct has array of True/False of their answers
        var total_correct = 0;
        for(let i = 0; i < users_correct.length; i++){
            var id;
            if(users_correct[i]){
                //Display correct checkmark
                id = "check_matching"+(i);
                total_correct += 1;
                document.getElementById(id).style.display = 'inline';
                document.getElementById(id).style.marginLeft = '375%';
            }
            else{
                //Display incorrect mark
                id = "wrong_matching"+(i);
                document.getElementById(id).style.display = 'inline';
                //Display correct answer
                document.getElementById("matching_correct"+i).style.display = 'block';
            }
        }
        var submitted_fib = '';
        if(total_correct === users_correct.length){
            submitted_fib = 'correct';
        }
        else if(total_correct / users_correct.length >= 0.5){
            submitted_fib = 'almost';
        }
        else{
            submitted_fib = 'incorrect';
        }

        document.getElementById("matching_bottom").style.marginTop = '10%';
        
        this.setState({submittedAnswer: true, submitted_fib: submitted_fib})
    }

    handleOnDragEnd(result){
        
        if(!result.destination){
            return;
        }
        var values_arr;
        var answered_arr;
        var source;
        if(result.source.droppableId !== result.destination.droppableId){
            //User is matching a pair
            if(result.source.droppableId === "all_values"){
                //Dragging from right list to answered list to one of the answered droppables
                //Make copy of the right side array of values
                values_arr = this.state.matching_pairs_values.slice();
                //Make copy of the left side array of values
                answered_arr = this.state.matching_pairs_answered.slice();
                //Remove element from right side array at source.index
                var [removed] = values_arr.splice(result.source.index, 1);
                //If there is a value in the answered_arr already, swap the source and destination
                var destination = answered_arr[parseInt(result.destination.droppableId.slice(-1))]
                if(destination !== ''){
                    values_arr.splice(result.source.index, 0, destination);
                }
                //Set left array at index of droppableID to removed element
                answered_arr[parseInt(result.destination.droppableId.slice(-1))] = removed;
                //Set state for updating both arrays

                //Remove required message and asterisks
                let id = "ast_matching"+ result.destination.droppableId.slice(-1);
                document.getElementById(id).style.display = 'none';
                document.getElementById("matching_required").style.display = 'none';

                this.setState({matching_pairs_values: values_arr, matching_pairs_answered: answered_arr});
            }
            else if(result.destination.droppableId === "all_values"){
                //Dragging from one of the answered droppables to the right most list
                values_arr = this.state.matching_pairs_values.slice();
                answered_arr = this.state.matching_pairs_answered.slice();
                //Set source as the element that is being dragged from left to right
                source = answered_arr[parseInt(result.source.droppableId.slice(-1))];
                //Remove element from left array
                answered_arr[parseInt(result.source.droppableId.slice(-1))] = "";
                //Add element to right array at correct index
                values_arr.splice(result.destination.index, 0, source);
                this.setState({matching_pairs_values: values_arr, matching_pairs_answered: answered_arr});
            }
            else{
                //Dragging from one of the left droppables to another left droppable
                answered_arr = this.state.matching_pairs_answered.slice();
                source = answered_arr[parseInt(result.source.droppableId.slice(-1))];
                destination = answered_arr[parseInt(result.destination.droppableId.slice(-1))];
                //Simply swap the two in the answered_arr
                answered_arr[parseInt(result.source.droppableId.slice(-1))] = destination;
                answered_arr[parseInt(result.destination.droppableId.slice(-1))] = source;
                this.setState({matching_pairs_answered: answered_arr});
            }
        }
        else{
            //User is rearranging inside of the same area
            if(result.destination.droppableId === "all_values"){
                var copied_vals = this.state.matching_pairs_values.slice();
                var [removed] = copied_vals.splice(result.source.index, 1);
                copied_vals.splice(result.destination.index, 0, removed);
                this.setState({matching_pairs_values: copied_vals});
            }
        }
    }

    startTimer(){
        this.setState({clock_started: true});
    }

    timer_finished(){
        var correct_answers = this.state.timer_answers;
        var total_correct = this.state.user_timer_answers.length;
        var status = ''
        if(total_correct === correct_answers.length){
            status = 'correct';
        }
        else if(total_correct / correct_answers.length >= 0.5){
            status = 'almost';
        }
        else{
            status = 'incorrect';
        }

        this.setState({clock_finished: true, status: status});
    }         


    render() {


        return (
            <div style={{height: "100vh", background: "#edd2ae", verticalAlign:"middle", overflowY:"auto"}}>
                <ProgressBar style={{background: "rgb(139 139 139)"}} now={this.state.progressVal} />
                <div>
                    <button onClick={() => this.props.history.push("/editCategory/" + this.state.plat_id+ "/"+this.state.cat_id)} className="x_button">X</button>
                </div>
                {this.state.completedCategory === true
                    ?
                        <div style={{textAlign: "center", margin: "auto", fontSize: "40px", padding: "155px"}}>
                            <p>Congratulations you have finished the quiz!</p>
                            <p>Click below to continue learning from {this.state.categoryName}.</p>
                            <Link className = "explore_more" to={"/editCategory/" + this.state.plat_id+ "/"+this.state.cat_id}>Explore More</Link>
                        </div>
                    :
                        (this.state.currentPage !== ''
                        ?
                            (this.state.currentPage.type === "Multiple Choice" 
                            ?
                                <div>
                                <p className="mc_prompt" >{this.state.currentPage.prompt}</p>
                                <div className="mc_choices">
                                {
                                (this.state.current_mc_array.map((choice, index) =>
                                <div>
                                    <button id={"mc"+index} disabled={this.state.submittedAnswer} className="mc_button" onClick={() => this.submitMC(choice, index)}>{String.fromCharCode(65+index)}.) {choice}</button>
                                </div>
                                ))
                                }
                                </div>
                                    {
                                        (this.state.submittedAnswer === false
                                        ?
                                            <p></p>
                                        :
                                            (this.state.submitted_answer_bool === false
                                            ?
                                                <div className = "continue_incorrect">
                                                    <div>
                                                        <button className = "report_button">Report <FontAwesomeIcon icon={faFlag} /></button>
                                                    </div>
                                                    <div className = "correct_phrase">
                                                        Incorrect!
                                                    </div>
                                                    <div className = "correct">
                                                        Correct Answer was: {this.state.currentPage.multiple_choice_answer}
                                                    </div>
                                                    <div>
                                                        <button className="continue_button_incorrect" onClick={() => this.continueButton()}>Continue</button>
                                                    </div>
                                                </div>
                                            :
                                                <div className = "continue_correct">
                                                    <div>
                                                    <button className = "report_button">Report <FontAwesomeIcon icon={faFlag} /></button>
                                                    </div>
                                                    <div className = "correct_phrase">
                                                        CORRECT!
                                                    </div>
                                                    <div>
                                                        <button className="continue_button_correct" onClick={() => this.continueButton()}>Continue</button>
                                                    </div>
                                                </div>
                                        )
                                    )
                                    }   
                                </div>
                            :
                                (this.state.currentPage.type === "Fill in the Blank"
                                ?
                                    <div>
                            
                                            <p style={{borderWidth: "0px 0px 2px 0px", width: "fit-content", margin: "auto", marginBottom: "30px", borderStyle: "solid"}} className="mc_prompt">Fill In The Blank:</p>
                                            <div style={{display: "flex", alignItems: "center", justifyContent: "center", fontSize: "25px", fontWeight: "400"}}>
                                                    {(this.state.segmented.map((val, index) =>
                                                        (index % 2 === 0 
                                                            ?

                                                            <div>
                                                                <div style={{whiteSpace: "pre"}} id={"fib"+index} >{val}</div>
                                                            </div>
                                                            :
                                                            <div style={{paddingLeft: "8px"}}>
                                                                <input id={"fib"+index} onChange={() => this.removeClass(index)} className = "blank" required placeholder={"Fill in the blank"}></input><FontAwesomeIcon id={"check"+index} className="check_mark" icon={faCheckCircle}/><FontAwesomeIcon id={"wrong"+index} className="wrong_mark" icon={faTimesCircle}/><p id={"ast"+index} className="asterisk">*</p>
                                                            </div>
                                                        )
                                                    ))}
                                            </div>
                                            <div style={{margin: "auto", textAlign: "center", marginTop: "10%"}}>
                                                <button style={{padding: "10px"}} className="continue_button_correct" onClick={() => this.submitFIB()} >Submit</button>
                                            </div>
                                       
                                        {
                                        (this.state.submittedAnswer === false
                                        ?
                                            <p></p>
                                        :
                                            (this.state.submitted_fib === 'incorrect'
                                            ?
                                                <div className = "continue_incorrect">
                                                    <div>
                                                        <button className = "report_button">Report <FontAwesomeIcon icon={faFlag} /></button>
                                                    </div>
                                                    <div className = "correct">
                                                        Incorrect!
                                                    </div>
                                                    <div className = "correct">
                                                        Correct Prompt was: {this.state.segmented.join(' ')}
                                                    </div>
                                                    <div>
                                                        <button className="continue_button_incorrect" onClick={() => this.continueButton()}>Continue</button>
                                                    </div>
                                                </div>
                                            :

                                                (this.state.submitted_fib === 'almost'
                                            ?
                                                <div className = "continue_incorrect">
                                                    <div>
                                                        <button className = "report_button">Report <FontAwesomeIcon icon={faFlag} /></button>
                                                    </div>
                                                    <div className = "correct">
                                                        You Almost Had It!
                                                    </div>
                                                    <div className = "correct">
                                                        Correct Prompt was: {this.state.segmented.join(' ')}
                                                    </div>
                                                    <div>
                                                        <button className="continue_button_incorrect" onClick={() => this.continueButton()}>Continue</button>
                                                    </div>
                                                </div>
                                            :

                                            
                                                <div className = "continue_correct">
                                                    <div>
                                                    <button className = "report_button">Report <FontAwesomeIcon icon={faFlag} /></button>
                                                    </div>
                                                    <div className = "correct">
                                                        You Nailed It!
                                                    </div>
                                                    <div>
                                                        <button className="continue_button_correct" onClick={() => this.continueButton()}>Continue</button>
                                                    </div>
                                                </div>
                                        )
                                        )
                                    )
                                    }  

                                    </div>
                                    
                                    
                                :
                                    (this.state.currentPage.type === "Matching"
                                    ?
                                        <div>
                                            <p className="mc_prompt" >{this.state.currentPage.prompt}</p>
                                            <p id="matching_required" style={{textAlign: "center", color: "red", display: "none", fontSize: "22px"}}>Make sure you match every pair before submitting!</p>
                                            <DragDropContext onDragEnd={(result) => this.handleOnDragEnd(result)}>
                                            <div style={{display:"flex"}}>
                                                <div className = "matching_outer">
                                                    <div style={{width:"100%"}}>
                                                        {
                                                        (Object.keys(this.state.currentPage.matching_pairs).map((key, index) =>
                                                            <div className = "key_blank_wrap">
                                                                <div className = "matching_key" id = {"matching_key" + {index}}>
                                                                    {key}
                                                                </div>
                                                                <div style={{margin: "auto", display: "flex", placeItems: "center"}}>
                                                                    <div id = {"matching_correct"+index} style={{display: "none"}} className = "matching_correct_answer">
                                                                        {this.state.currentPage.matching_pairs[key]}
                                                                    </div>
                                                                    <FontAwesomeIcon id={"check_matching"+index} className="check_mark" icon={faCheckCircle}/><FontAwesomeIcon id={"wrong_matching"+index} className="wrong_mark" icon={faTimesCircle}/><p id={"ast_matching"+index} className="asterisk">*</p>
                                                                </div>
                                                                <Droppable droppableId={"blank_match"+ index} key={"blank_match"+ index}>
                                                                    {(provided, snapshot) => {
                                                                        return (
                                                                            <div {...provided.droppableProps} ref={provided.innerRef} className = "matching_key" style={{background: "grey", marginLeft:"auto"}}>
                                                                                <div>
                                                                                        {(this.state.matching_pairs_answered[index] === ""
                                                                                        ?
                                                                                            <p></p>
                                                                                        :
                                                                                        
                                                                                            <Draggable key={"blank_drag"+ index} draggableId={"blank_drag"+ index} index = {index}>
                                                                                                {(provided, snapshot) => {
                                                                                                    return (
                                                                                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className = "matching_each_value_temp" id = {"matching_blank" + {index}}>
                                                                                                        {this.state.matching_pairs_answered[index]}
                                                                                                        {provided.placeholder}
                                                                                                    </div>
                                                                                                )
                                                                                                }}
                                                                                            </Draggable>
                                                                                        
                                                                                        )}
                                                                                </div> 
                                                                                {provided.placeholder}
                                                                            </div>
                                                                        )}}
                                                                </Droppable>
                                                            </div>
                                                        ))
                                                        }
                                                    </div>
                                                </div>
                                                <div className = "matching_values_outer">
                                                    <Droppable droppableId={"all_values"} key={"all_values"}>
                                                    {(provided, snapshot) => {
                                                            return (
                                                                <div {...provided.droppableProps} ref={provided.innerRef} style={{width:"100%"}}> 
                                                                    {
                                                                        (this.state.matching_pairs_values.map((value, index) =>
                                                                            <Draggable key={"key_id"+ index} draggableId={"key_id"+ index} index = {index}>
                                                                                {(provided, snapshot) => {
                                                                                    return (
                                                                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                                                        <div className = "matching_each_value" id = {"matching_value" + {index}}>
                                                                                            {value}
                                                                                        </div>
                                                                                    </div>
                                                                                    )
                                                                                }}
                                                                            </Draggable>
                                                                        ))
                                                                    }  
                                                                    {provided.placeholder}
                                                                </div>
                                                            )}
                                                                }
                                                    </Droppable>
                                                </div>
                                            </div>
                                            </DragDropContext>
                                            <div id="matching_bottom" style={{margin: "auto", textAlign: "center", marginTop: "2%"}}>
                                                <button style={{padding: "10px"}} className="continue_button_correct" onClick={() => this.submitMatching()} >Submit</button>
                                            </div>

                                            {
                                                (this.state.submittedAnswer === false
                                                ?
                                                    <p></p>
                                                :
                                                    (this.state.submitted_fib === 'incorrect'
                                                    ?
                                                        <div className = "continue_incorrect">
                                                            <div>
                                                                <button className = "report_button">Report <FontAwesomeIcon icon={faFlag} /></button>
                                                            </div>
                                                            <div className = "correct">
                                                                Incorrect!
                                                            </div>
                                                            <div>
                                                                <button className="continue_button_incorrect" onClick={() => this.continueButton()}>Continue</button>
                                                            </div>
                                                        </div>
                                                    :

                                                        (this.state.submitted_fib === 'almost'
                                                    ?
                                                        <div className = "continue_incorrect">
                                                            <div>
                                                                <button className = "report_button">Report <FontAwesomeIcon icon={faFlag} /></button>
                                                            </div>
                                                            <div className = "correct">
                                                                You Almost Had It!
                                                            </div>
                                                            <div>
                                                                <button className="continue_button_incorrect" onClick={() => this.continueButton()}>Continue</button>
                                                            </div>
                                                        </div>
                                                    :

                                                    
                                                        <div className = "continue_correct">
                                                            <div>
                                                            <button className = "report_button">Report <FontAwesomeIcon icon={faFlag} /></button>
                                                            </div>
                                                            <div className = "correct">
                                                                You Nailed It!
                                                            </div>
                                                            <div>
                                                                <button className="continue_button_correct" onClick={() => this.continueButton()}>Continue</button>
                                                            </div>
                                                        </div>
                                                )
                                                )
                                            )
                                            }

                                        </div>
                                    :
                                        (this.state.currentPage.type === "Timer"
                                        ?   
                                            (this.state.clock_started
                                            ?
                                            <div>
                                                {this.state.clock_finished
                                                ?
                                                    <div>
                                                        <p className="mc_prompt">{this.state.currentPage.prompt}</p>
                                                        <div className="mc_prompt" style={{marginTop: "5%"}}>You answered {this.state.user_timer_answers.length} out of {this.state.timer_answers.length} correctly!</div>
                                                        {this.state.user_timer_answers.length !== this.state.timer_answers.length
                                                        ?  
                                                            <div style={{color:"red"}} className="mc_prompt">
                                                                Answers you missed: {this.missed_answers()}
                                                            </div>
                                                        :
                                                            <br></br>
                                                        }
                                                        {(this.state.status === 'incorrect'
                                                            ?
                                                                <div className = "continue_incorrect">
                                                                    <div>
                                                                        <button className = "report_button">Report <FontAwesomeIcon icon={faFlag} /></button>
                                                                    </div>
                                                                    <div className = "correct">
                                                                        Incorrect!
                                                                    </div>
                                                                    <div>
                                                                        <button className="continue_button_incorrect" onClick={() => this.continueButton()}>Continue</button>
                                                                    </div>
                                                                </div>
                                                            :

                                                                (this.state.status === 'almost'
                                                            ?
                                                                <div className = "continue_incorrect">
                                                                    <div>
                                                                        <button className = "report_button">Report <FontAwesomeIcon icon={faFlag} /></button>
                                                                    </div>
                                                                    <div className = "correct">
                                                                        You Almost Had It!
                                                                    </div>
                                                                    <div>
                                                                        <button className="continue_button_incorrect" onClick={() => this.continueButton()}>Continue</button>
                                                                    </div>
                                                                </div>
                                                            :

                                                            
                                                                <div className = "continue_correct">
                                                                    <div>
                                                                    <button className = "report_button">Report <FontAwesomeIcon icon={faFlag} /></button>
                                                                    </div>
                                                                    <div className = "correct">
                                                                        You Nailed It!
                                                                    </div>
                                                                    <div>
                                                                        <button className="continue_button_correct" onClick={() => this.continueButton()}>Continue</button>
                                                                    </div>
                                                                </div>
                                                        )
                                                        )}
                                                        
                                                    </div>
                                                :
                                                    
                                                <div>
                                                    <p className="mc_prompt">{this.state.currentPage.prompt}</p>
                                                    <div style={{textAlign: "center", fontSize: "25px", marginTop: "5%"}}>
                                                        <div style={{justifyContent: "center"}}>
                                                            <Timer style={{marginLeft: "-1%"}} minutes={this.state.minutes} seconds={this.state.seconds} end_clock={this.timer_finished} stopClock={click => this.stopClock = click}/>
                                                            <button style={{marginLeft: "1%", border: "transparent", background: "transparent"}} className="explore_more" onClick={() => this.stopClock()}>Give Up</button>
                                                        </div>
                                                        <div style={{display: "flex", marginTop: "3%", marginBottom: "3%", justifyContent: "center"}}>
                                                            <div style={{marginLeft: "-1%"}}>
                                                                Enter Answer: 
                                                            </div>
                                                            <input id = "timer_answer_input" onChange={this.timer_answer} style={{borderRadius: "5px", border: "1px solid", marginLeft: "1%"}}></input>
                                                        </div>
                                                </div>
                                                <div className="your_answers">
                                                        Your Answers:
                                                </div>
                                                <div style={{marginLeft: "93%", fontSize: "20px"}}>
                                                    {this.state.user_timer_answers.length} / {this.state.timer_answers.length}
                                                </div>
                                                <div className="user_timer_answers">
                                                    <div style={{display: "flex", flexWrap: "wrap", marginLeft: "0.5%", marginRight: "0.5%", overflowY: "auto", height: "100%"}}>
                                                        {this.state.user_timer_answers.map((answer, index) =>
                                                        <div className = "specific_timer_answer">
                                                            {answer}
                                                        </div>
                                                        )}
                                                    </div>
                                                </div>
                                                </div>
                                                  
                                                }
                                            
                                            </div>
                                            
                                            :
                                            <div>
                                                <p className="mc_prompt">Start the clock to begin playing!</p>
                                                <p className="mc_prompt">You do not have to press Enter to submit, your answer will automatically submit if it is correct.</p>
                                                <div style={{textAlign: "center", fontSize: "25px", marginTop: "5%"}}>
                                                    <div style={{display: "flex", justifyContent: "center"}}>
                                                        <div style={{marginLeft: "-1%"}}>Time Remaining: {this.state.minutes}:{this.state.seconds < 10 ? `0${this.state.seconds}` : this.state.seconds}</div>
                                                        <button style={{marginTop: "0", marginLeft: "1%"}}className = "continue_button_correct" onClick={() => this.startTimer()}>Start Clock</button>
                                                    </div>
                                                    <div style={{display: "flex", marginTop: "3%", marginBottom: "3%", justifyContent: "center"}}>
                                                        <div style={{marginLeft: "-1%"}}>
                                                            Enter Answer: 
                                                        </div>
                                                        <input style={{borderRadius: "5px", border: "1px solid", marginLeft: "1%"}}></input>
                                                    </div>
                                                </div>
                                                <div className="your_answers">
                                                        Your Answers:
                                                </div>
                                                
                                                <div className="user_timer_answers">
                                                    
                                                </div>
                                            </div>
                                            )
                                        :
                                            <p></p>
                                        )
                                    )
                                )
                            )
                           
                        :
                        <div style={{height: "100vh", background: "#edd2ae", verticalAlign:"middle"}}>
                            <p style={{color: "white"}}></p>
                        </div>
                        )
                }
            </div>
        );
    }
}