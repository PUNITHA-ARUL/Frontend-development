function findmax()
{
    max= -Infinity
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