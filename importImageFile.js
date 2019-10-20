var input = document.querySelector('input[type=file]');


input.onchange = function () {
    var file = input.files[0];
    drawOnCanvas(file);
};


function drawOnCanvas(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
        var dataURL = e.target.result,
            c = document.querySelector('canvas'),
            ctx = c.getContext('2d'),
            img = new Image();

        img.onload = function () {
            var ratio = img.height / img.width
            // c.width = (window.innerWidth - 180)
            // c.height = window.innerHeight
            var imgHeight = (window.innerWidth/2 - 180)
            ctx.drawImage(img, 0, 0, imgHeight, imgHeight*ratio);
        };

        img.src = dataURL;
    };

    reader.readAsDataURL(file);
}


document.getElementById("ClearButton").onclick = function () { clearImage() };

function clearImage() {
    drawOnCanvas(null);
}
