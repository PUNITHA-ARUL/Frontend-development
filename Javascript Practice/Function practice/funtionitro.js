// Today celsius
function celsius()
{
    return 'Today Celsius:'
}

let weather = celsius();      

console.log(weather);
// add celsius
function add(a,b)
{
    return(a+b)
}
let sum=add(40,30)
console.log(sum)

//varialbe used to store the return value of a function
// text of temperature
let text = "The temperature "+  weather1(77) +" Celsius";

function weather1(frhrenheit)
{
    return (5/9)* (frhrenheit-32)
}

console.log(text)

//To use the returned value, you can store it in a variable or display it
function call()
{
    return"Hello"
}

// display the returned value
console.log(call())

// variable as store the function
// using console.log or html
let greeting= console.log(call());

//function can be called from anywhere
//like events,other function,any code block
function hello()
{
    return "Hello World"
}

function showhello()
{
    document.getElementById("demo").innerHTML=hello();
}

