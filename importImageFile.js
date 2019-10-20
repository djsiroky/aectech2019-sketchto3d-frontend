var input = document.querySelector('input[type=file]');
input.onchange = function () {
    var file = input.files[0];
    drawOnCanvas(file);
};


function drawOnCanvas(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
        var dataURL = e.target.result,
            c = document.querySelector('canvas#drawingCanvas'),
            ctx = c.getContext('2d'),
            img = new Image();

        img.onload = function () {
            c.dispatchEvent(new CustomEvent('pre-img-upload'));
            var ratio = img.height / img.width
            // c.width = (window.innerWidth - 180)
            // c.height = window.innerHeight
            var imgHeight = (window.innerWidth/2 - 180)
            var imgHeight = (img.width * (c.width / img.width)) / ratio;
            c.height = imgHeight;
            ctx.drawImage(img, 0, 0, c.width, c.height);
            var pixels = ctx.getImageData(0, 0, c.width, c.height);
            pixels = threshold(pixels, 50);
            ctx.putImageData(pixels, 0, 0);
            c.dispatchEvent(new CustomEvent('img-upload'));
        };

        img.src = dataURL;
    };

    reader.readAsDataURL(file);
}


document.getElementById("ClearButton").onclick = function () { clearImage() };

function clearImage() {
    drawOnCanvas(null);
}

function threshold(pixels, threshold) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
        var r = d[i];
        var g = d[i + 1];
        var b = d[i + 2];
        var v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= threshold) ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = v
    }
    return pixels;
};