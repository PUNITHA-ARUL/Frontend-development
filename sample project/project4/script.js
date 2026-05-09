var popupoverlay =document.querySelector(".popup-overlay")
var popupcreate=document.querySelector(".popup-create")
var addpopbutton=document.getElementById("add-popup-button")
 addpopbutton.addEventListener("click",function()
{
    popupoverlay.style.display="block"
    popupcreate.style.display="block"
})
var cancelpopbutton=document.getElementById("cancel-popup")
cancelpopbutton.addEventListener("click",function(event)
{
  event.preventDefault()
  popupoverlay.style.display="none"
  popupcreate.style.display="none"

})

//add button click and automatically create the popupbox
//select popup,book-title-input,book-author-input,book-description,add-book

var popup= document.querySelector(".popup")
var booktitle= document.getElementById("book-title-input")
var bookauthor= document.getElementById("book-author-input")
var bookdescription= document.getElementById("book-description")
var addbook= document.getElementById("add-book")

addbook.addEventListener("click",function(event)
{
  event.preventDefault()
  var div=document.createElement("div")
  div.setAttribute("class","book-popup")
  div.innerHTML=`<h2>${booktitle.value}</h2>
  <h5>${bookauthor.value}</h5>
  <p>${bookdescription.value}</p>
  <button onclick="deletebook(event)">Delete</button>`
  popup.append(div)   
  popupoverlay.style.display="none"
  popupcreate.style.display="none"  
        

})

function deletebook(event)
{
  event.target.parentElement.remove() 
}