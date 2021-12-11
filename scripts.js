const furnitures = document.querySelectorAll(".furniture");

furnitures.forEach((furn) => {
  const drag = (e) => {
    furn.style.top = e.pageY + "px";
    furn.style.left = e.pageX + "px";
    furn.classList.add("redborder");
  };

  furn.addEventListener("mousedown", () => {
    window.addEventListener("mousemove", drag);
  });

  window.addEventListener("mouseup", () => {
    window.removeEventListener("mousemove", drag);
    furn.classList.remove("redborder");
  });
});