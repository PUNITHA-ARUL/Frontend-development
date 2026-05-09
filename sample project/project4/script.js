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

}

)
