var name= document.getElementById("name");
var email= document.getElementById("email");
var message= document.getElementById("message");
var submit= document.getElementById("submit");

submit.addEventListener("click", function(event){
    event.preventDefault();
    if(name.value === "" || email.value === "" || message.value === ""){
        alert("Please fill in all fields.");
    } else {
        alert("Thank you for your message, " + name.value + "!");
        name.value = "";
        email.value = "";
        message.value = "";
    }
});