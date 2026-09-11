const video =
    document.getElementById("video");

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");

const startScreen =
    document.getElementById("startScreen");

const startButton =
    document.getElementById("start");

const filterOverlay =
    document.getElementById("filterOverlay");

const filterStatus =
    document.getElementById("filterStatus");


let stream = null;

let handsDetected = [];

let currentFilter = "normal";

let filterIndex = 0;

let lastTouch = false;

let lastFilterChange = 0;


/*
=========================================================
FILTER ORDER

Every time pinky touches thumb:

NORMAL
↓
INVERT
↓
BLACK & WHITE
↓
NEGATIVE CYBER
↓
RED
↓
BLUE
↓
NORMAL
=========================================================
*/

const filters = [
    "normal",
    "invert",
    "bw",
    "negative",
    "red",
    "blue"
];

const filterNames = {
    normal: "FILTER / NORMAL",
    invert: "FILTER / INVERTED",
    bw: "FILTER / BLACK & WHITE",
    negative: "FILTER / CYBER NEGATIVE",
    red: "FILTER / RED",
    blue: "FILTER / BLUE"
};


/* =========================================================
   CANVAS
========================================================= */

function resize() {

    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;

}

window.addEventListener(
    "resize",
    resize
);

resize();


/* =========================================================
   MEDIAPIPE
========================================================= */

const hands =
    new Hands({

        locateFile: file => {

            return (
                "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" +
                file
            );

        }

    });


hands.setOptions({

    maxNumHands: 2,

    modelComplexity: 1,

    minDetectionConfidence: .65,

    minTrackingConfidence: .65

});


hands.onResults(
    results => {

        handsDetected =
            results.multiHandLandmarks || [];

    }
);


/* =========================================================
   COORDINATES
========================================================= */

function point(landmark) {

    return {

        x:
            (1 - landmark.x) *
            canvas.width,

        y:
            landmark.y *
            canvas.height

    };

}


/* =========================================================
   DISTANCE
========================================================= */

function distance(a, b) {

    const dx =
        a.x - b.x;

    const dy =
        a.y - b.y;

    return Math.sqrt(
        dx * dx +
        dy * dy
    );

}


/* =========================================================
   CHANGE FILTER
========================================================= */

function changeFilter() {

    filterIndex++;

    if (
        filterIndex >=
        filters.length
    ) {

        filterIndex = 0;

    }

    currentFilter =
        filters[filterIndex];


    /*
       Remove all previous
       filter classes.
    */

    filterOverlay.className =
        "";


    /*
       Apply the new filter.
    */

    if (
        currentFilter !==
        "normal"
    ) {

        filterOverlay.classList.add(
            currentFilter
        );

    }


    /*
       Update HUD.
    */

    filterStatus.textContent =
        filterNames[currentFilter];


    /*
       Make sure the overlay
       remains visible when
       a filter is active.
    */

    filterOverlay.style.opacity =
        currentFilter === "normal"
            ? "0"
            : "0.95";

}


/* =========================================================
   DRAW LINE
========================================================= */

function drawLine(
    a,
    b,
    color = "#00eaff",
    width = 1
) {

    ctx.beginPath();

    ctx.moveTo(
        a.x,
        a.y
    );

    ctx.lineTo(
        b.x,
        b.y
    );

    ctx.strokeStyle =
        color;

    ctx.lineWidth =
        width;

    ctx.shadowBlur =
        8;

    ctx.shadowColor =
        color;

    ctx.stroke();

    ctx.shadowBlur = 0;

}


/* =========================================================
   DRAW POINT
========================================================= */

function drawPoint(
    p,
    active = false
) {

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        active ? 8 : 4,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        active
            ? "#ffffff"
            : "#8fffff";

    ctx.shadowBlur =
        active ? 25 : 12;

    ctx.shadowColor =
        "#00eaff";

    ctx.fill();

    ctx.shadowBlur = 0;

}


/* =========================================================
   DRAW FRAME
========================================================= */

function drawFrame(points) {

    if (
        !points ||
        points.length !== 4
    ) {

        return;

    }


    const [
        a,
        b,
        c,
        d
    ] = points;


    const minX =
        Math.min(
            a.x,
            b.x,
            c.x,
            d.x
        );

    const maxX =
        Math.max(
            a.x,
            b.x,
            c.x,
            d.x
        );

    const minY =
        Math.min(
            a.y,
            b.y,
            c.y,
            d.y
        );

    const maxY =
        Math.max(
            a.y,
            b.y,
            c.y,
            d.y
        );


    /*
       =====================================================
       THIS IS THE IMPORTANT PART

       The filter overlay is positioned exactly over
       the tracked box.

       It does NOT affect the camera outside the box.
       =====================================================
    */

    filterOverlay.style.left =
        `${minX}px`;

    filterOverlay.style.top =
        `${minY}px`;

    filterOverlay.style.width =
        `${maxX - minX}px`;

    filterOverlay.style.height =
        `${maxY - minY}px`;


    /*
       =====================================================
       FRAME BORDER
       =====================================================
    */

    drawLine(
        a,
        b,
        "#00eaff",
        1.5
    );

    drawLine(
        b,
        c,
        "#00eaff",
        1.5
    );

    drawLine(
        c,
        d,
        "#00eaff",
        1.5
    );

    drawLine(
        d,
        a,
        "#00eaff",
        1.5
    );


    /*
       =====================================================
       CORNER MARKERS
       =====================================================
    */

    drawCorner(
        a,
        1,
        1
    );

    drawCorner(
        b,
        -1,
        1
    );

    drawCorner(
        c,
        -1,
        -1
    );

    drawCorner(
        d,
        1,
        -1
    );


    /*
       =====================================================
       TRACKING POINTS
       =====================================================
    */

    points.forEach(
        p => {

            drawPoint(p);

        }
    );

}


/* =========================================================
   CORNER
========================================================= */

function drawCorner(
    p,
    xDirection,
    yDirection
) {

    const size = 16;


    drawLine(
        p,
        {
            x:
                p.x +
                size *
                xDirection,

            y:
                p.y
        },
        "#00eaff",
        2
    );


    drawLine(
        p,
        {
            x:
                p.x,

            y:
                p.y +
                size *
                yDirection
        },
        "#00eaff",
        2
    );

}


/* =========================================================
   GET FRAME
========================================================= */

function getFramePoints() {

    if (
        handsDetected.length === 0
    ) {

        return null;

    }


    /*
       TWO HAND MODE
    */

    if (
        handsDetected.length >= 2
    ) {

        const handA =
            handsDetected[0];

        const handB =
            handsDetected[1];


        const indexA =
            point(
                handA[8]
            );

        const thumbA =
            point(
                handA[4]
            );

        const indexB =
            point(
                handB[8]
            );

        const thumbB =
            point(
                handB[4]
            );


        if (
            indexA.x <
            indexB.x
        ) {

            return [
                indexA,
                indexB,
                thumbB,
                thumbA
            ];

        }


        return [
            indexB,
            indexA,
            thumbA,
            thumbB
        ];

    }


    /*
       ONE HAND MODE
    */

    const hand =
        handsDetected[0];

    const index =
        point(
            hand[8]
        );

    const thumb =
        point(
            hand[4]
        );


    const centerX =
        (
            index.x +
            thumb.x
        ) / 2;

    const centerY =
        (
            index.y +
            thumb.y
        ) / 2;


    const width =
        Math.max(
            100,
            Math.abs(
                index.x -
                thumb.x
            ) * 2.5
        );

    const height =
        Math.max(
            80,
            Math.abs(
                index.y -
                thumb.y
            ) * 2.5
        );


    return [

        {
            x:
                centerX -
                width / 2,

            y:
                centerY -
                height / 2
        },

        {
            x:
                centerX +
                width / 2,

            y:
                centerY -
                height / 2
        },

        {
            x:
                centerX +
                width / 2,

            y:
                centerY +
                height / 2
        },

        {
            x:
                centerX -
                width / 2,

            y:
                centerY +
                height / 2
        }

    ];

}


/* =========================================================
   PINKY + THUMB DETECTION
========================================================= */

function detectPinkyThumb() {

    let touching =
        false;


    for (
        const landmarks
        of handsDetected
    ) {

        /*
           MediaPipe:

           4  = thumb tip
           20 = pinky tip
        */

        const thumb =
            point(
                landmarks[4]
            );

        const pinky =
            point(
                landmarks[20]
            );


        const d =
            distance(
                thumb,
                pinky
            );


        const threshold =
            Math.min(
                canvas.width,
                canvas.height
            ) * .075;


        const isTouching =
            d < threshold;


        /*
           Draw connection only.
        */

        drawLine(
            thumb,
            pinky,

            isTouching
                ? "#ffffff"
                : "rgba(0,234,255,.25)",

            isTouching
                ? 3
                : 1
        );


        drawPoint(
            thumb,
            isTouching
        );

        drawPoint(
            pinky,
            isTouching
        );


        if (
            isTouching
        ) {

            touching =
                true;

        }

    }


    /*
       =====================================================
       CHANGE THE BOX FILTER ONLY ONCE WHEN CONTACT STARTS
       =====================================================
    */

    if (
        touching &&
        !lastTouch
    ) {

        const now =
            performance.now();


        if (
            now -
            lastFilterChange >
            500
        ) {

            lastFilterChange =
                now;

            changeFilter();

        }

    }


    lastTouch =
        touching;

}


/* =========================================================
   DRAW HAND SKELETON
========================================================= */

const connections = [

    [0,1],
    [1,2],
    [2,3],
    [3,4],

    [0,5],
    [5,6],
    [6,7],
    [7,8],

    [5,9],
    [9,10],
    [10,11],
    [11,12],

    [9,13],
    [13,14],
    [14,15],
    [15,16],

    [13,17],
    [17,18],
    [18,19],
    [19,20],

    [0,17]

];


function drawHands() {

    for (
        const landmarks
        of handsDetected
    ) {

        const points =
            landmarks.map(
                point
            );


        for (
            const [
                a,
                b
            ]
            of connections
        ) {

            drawLine(
                points[a],
                points[b],
                "rgba(0,210,255,.35)",
                1
            );

        }


        /*
           Thumb + pinky highlighted.
        */

        drawPoint(
            points[4]
        );

        drawPoint(
            points[20]
        );

    }

}


/* =========================================================
   MAIN RENDER LOOP
========================================================= */

function render() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    const frame =
        getFramePoints();


    if (frame) {

        drawFrame(
            frame
        );

    }
    else {

        /*
           Hide the filter if no
           hand/frame is detected.
        */

        filterOverlay.style.opacity =
            "0";

    }


    drawHands();

    detectPinkyThumb();


    requestAnimationFrame(
        render
    );

}


/* =========================================================
   CAMERA
========================================================= */

async function startCamera() {

    try {

        stream =
            await navigator.mediaDevices.getUserMedia({

                video: {

                    width: {
                        ideal: 1280
                    },

                    height: {
                        ideal: 720
                    },

                    facingMode:
                        "user"

                },

                audio: false

            });


        video.srcObject =
            stream;


        await video.play();


        startScreen.classList.add(
            "hidden"
        );


        async function process() {

            if (
                video.readyState >=
                HTMLMediaElement.HAVE_CURRENT_DATA
            ) {

                await hands.send({

                    image:
                        video

                });

            }

            requestAnimationFrame(
                process
            );

        }


        process();

        render();

    }
    catch (error) {

        console.error(
            error
        );

        alert(
            "Camera access is required."
        );

    }

}


/* =========================================================
   START
========================================================= */

startButton.addEventListener(
    "click",
    startCamera
);


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            if (stream) {

                stream
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );

            }

            location.reload();

        }

    }
);