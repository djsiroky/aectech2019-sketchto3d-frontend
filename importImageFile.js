// var imageCanvas;

// document.getElementById("myFileInput").onclick = function () { ImageLoader() };

// function ImageLoader() {
//     // Here, we use a callback to display the image after loading
//     p.loadImage('icon/draw.svg', img => {
//         p.image(img, 0, 0);
//     });
// }


var input = document.querySelector('input[type=file]'); // see Example 4
input.onchange = function () {
    var file = input.files[0];
    //upload(file);
    drawOnCanvas(file);   // see Example 6
    //displayAsImage(file); // see Example 7
};

function upload(file) {
    var form = new FormData(),
        xhr = new XMLHttpRequest();

    form.append('image', file);
    xhr.open('post', 'server.php', true);
    xhr.send(form);
}

function drawOnCanvas(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
        var dataURL = e.target.result,
            c = document.querySelector('canvas'), // see Example 4
            ctx = c.getContext('2d'),
            img = new Image();

        img.onload = function () {
            var ratio = img.height / img.width
            c.width = (window.innerWidth - 180)
            c.height = window.innerHeight
            var imgHeight = (window.innerWidth - 180)/2
            
            ctx.drawImage(img, 0, 0, imgHeight, imgHeight*ratio);
        };

        img.src = dataURL;
    };

    reader.readAsDataURL(file);
}

function displayAsImage(file) {
    var imgURL = URL.createObjectURL(file),
        img = document.createElement('img');

    img.onload = function () {
        URL.revokeObjectURL(imgURL);
    };

    img.src = imgURL;
    document.body.appendChild(img);
}