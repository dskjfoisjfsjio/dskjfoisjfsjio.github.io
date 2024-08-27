let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function minusSlides(n) {
  showSlides(slideIndex -= n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

setInterval(() => {
plusSlides(1);
}, 3000);

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) { slideIndex = 1; }
  if (n < 1) { slideIndex = slides.length; }
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex - 1].style.display = "block";
  dots[slideIndex - 1].className += " active";
}

document.addEventListener("keydown", function (event) {
  switch (event.which) {
    case 39: 
      plusSlides(1);
      break;
    case 37:
      minusSlides(1);
      break;
  }
});