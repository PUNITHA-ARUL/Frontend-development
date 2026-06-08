// maximum number of argument object
function findmax() {
    let max = -Infinity
    for (i = 0; i < arguments.length; i++) {
        if (arguments[i] > max) {
            max = arguments[i]
        }
    }
    return max
}

console.log('Here your infinity number', + findmax(300, 400, 500))

// minimum number of argument object
function findmin() {
    let min = Infinity
    for (i = 0; i < arguments.length; i++) {
        if (arguments[i] < min) {
            min = arguments[i]
        }
    }
    return min
}
console.log('Here your infinity number', + findmin(300, 400, 500))

// sum of the number 
function findsum(a, b, c) {
    return (a + b + c)
}
console.log('Here your infinity number', + findsum(300, 400, 500))

// count the number length
function findcount() {
    for (i = 0; i = arguments.length; i++) {
        return (i)
    }
}
console.log('Here your infinity number', + findcount(300, 400, 500))

// largest even number

function findeven() {
    max =  -Infinity
    for (i = 0; i < arguments.length; i++) {
        if (arguments[i] > max) {
            if(arguments[i] % 2 == 0){
                max = arguments[i]

            }
        }
    }
    return max
}
console.log('Here your infinity number', + findeven(300, 400, 500))

//ingore the negative number
function findmaxpositive()
{
    let max= -Infinity
    for(i=0; i < arguments.length; i++){
        if(arguments[i] >= 0 && arguments[i] > max ){
            max = arguments[i]
        }
        
    }    
  return max    
}
console.log('Here your infinity number',  findmaxpositive(-1,4,3));

//check all number is positive
function findallpositive()
{
    for(i=0; i < arguments.length; i++)
    {
        if(arguments[i] >=0 ){
           return true
        }
        else{
           return false
        }
    }
}
console.log('Here your infinity number',  findallpositive(1,4,3));