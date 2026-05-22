function findmax()
{
    let max= -Infinity
    for(i = 0; i < arguments.length; i++)
    {
        if(arguments[i] > max)
        {
            max= arguments[i]
        }
    }
    return max
}

console.log('Here your infinity number', + findmax(300,400,500))

function findmin()
{
   let  max= Infinity
    for( i=0; i < arguments.length; i++)
    {
        if(arguments[i] < max)
        {
            max= arguments[i]
        }
    }
return max
}
console.log('Here your infinity number', + findmin(300,400,500))
