"use strict";

/*
todo:
text nodes+font info
search
keyboard navigation
*/

(function () {
    var PSD = require('psd');
    var main = document.querySelector("main");
    var panel = document.querySelector("aside");
    const NS_SVG = "http://www.w3.org/2000/svg";

    document.querySelectorAll("form.select-file").forEach(function (form) {
        form.open.addEventListener("submit", function (e) {
            e.preventDefault();
        });

        form.addEventListener("dragover", function (e) {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        }, true);

        document.addEventListener("dragenter", function () {
            form.classList.add("dropzone-active");
        }, true);

        document.addEventListener("dragleave", function () {
            form.classList.remove("dropzone-active");
        }, true);

        document.addEventListener("drop", function (e) {
            e.stopPropagation();
            e.preventDefault();
            form.classList.remove("dropzone-active");

            loadFile(e.dataTransfer.files[0]);
        }, true);

        form.file.addEventListener("change", function (e) {
            if (this.files[0]) {
                loadFile(this.files[0]);
            }; // if
        });

        form.open.addEventListener("click", function () {
            var evt = document.createEvent("MouseEvents");
            evt.initEvent("click", true, true);
            form.file.dispatchEvent(evt);
        });
    });

    function selectItem(li) {
        var svg = document.querySelector("main svg");
        var preview = document.querySelector("section.info div.preview");

        // unselect
        if (svg) {
            while (svg.firstChild) svg.firstChild.remove();
        }; // if
        if (preview) {
            [].slice.call(preview.querySelectorAll("img")).forEach((el) => el.remove());
            preview.querySelectorAll("button").forEach((el) => el.disabled = true);
        }; // if
        document.querySelectorAll("ul.layers li.active").forEach((li) => li.classList.remove("active"));

        if (li && li.psdData) {
            var psdData = li.psdData;
            li.classList.add("active");
            console.log(psdData);

            window.pd = psdData;

            if (svg) {
                var r = document.createElementNS(NS_SVG, "rect");
                r.setAttribute("x",psdData.left);
                r.setAttribute("y", psdData.top);
                r.setAttribute("width",psdData.width);
                r.setAttribute("height",psdData.height);
                svg.appendChild(r);
            }; // if

            setTimeout(function () {
                try {
                    var img = psdData.layer.image.toPng();
                    img.removeAttribute("width");
                    img.removeAttribute("height");
                    preview.appendChild(img);

                    preview.querySelectorAll("button").forEach((el) => el.disabled = false);
                } // try
                catch (e) {
                    console.log(e);
                }; // catch
            },0);
        }; // if
    }; // function selectItem

    document.addEventListener("click", function (event) {
        var b = event.target.closest("button[name=collapse]");
        if (b) {
            b.closest("li").classList.toggle("collapsed");
            return;
        }; // if

        var b = event.target.closest("ul.layers li");
        if (b) {
            selectItem(b);
            return;
        }; // if

        var b = event.target.closest("button[name=clipboard]");
        if (b) {
            try {
                var img = b.closest("div").querySelector("img");

                fetch(img.getAttribute("src")).then(function (res) {
                    res.blob().then(function (blob) {
                        navigator.clipboard.write([new ClipboardItem({"image/png": blob})]);
                    })
                });
            } // try
            catch (e) {
                console.log(e);
            }; // catch
        }; // if
    }, true);

    function loadFile(file) {
        document.body.classList.add("loading");

        function buildTree(ul, obj) {
            try {
                obj.children && obj.children().forEach(function (el) {
                    var li = document.createElement("li");
                    !el.layer.visible && li.classList.add("layer-hidden");
                    ul.appendChild(li);
                    li.psdData = el;

                    var s = document.createElement("span");
                    s.setAttribute("tabindex", "0");
                    s.setAttribute("title", el.name);
                    li.appendChild(s);

                    var l1 = document.createElement("strong");
                    l1.textContent = el.name;
                    //(el.constructor.name === "Layer") && l1.setAttribute("data-type", "L");
                    (el.constructor.name === "Group") && l1.setAttribute("data-type", "G");
                    s.appendChild(l1);

                    var l2 = document.createElement("p");
                    s.appendChild(l2);

                    var str = document.createElement("span");
                    str.textContent = el.width + "×" + el.height;
                    l2.appendChild(str);

                    var bm = el.layer.blendingMode();
                    if (bm && bm != "normal") {
                        var str = document.createElement("span");
                        str.setAttribute("title", "blending mode");
                        str.textContent = bm;
                        l2.appendChild(str);
                    }; // if
                    if (el.layer.opacity != 255) {
                        var str = document.createElement("span");
                        str.textContent = "opacity: " + el.layer.opacity;
                        l2.appendChild(str);
                    }; // if

                    // text

                    if (el.children && el.children().length) {
                        var b = document.createElement("button");
                        b.setAttribute("name", "collapse");
                        s.insertBefore(b, s.firstChild);

                        li.classList.add("has-children");

                        var ul2 = document.createElement("ul");
                        li.appendChild(ul2);
                        buildTree(ul2, el);
                    }; // if
                });
            } // try
            catch (e) {
                console.log(e);
            }; // catch
        }; // function

        PSD.fromDroppedFile(file).then(function (psd) {
                // manual http://meltingice.github.io/psd.js/
                window.psd = psd;console.log(psd);
                try {
                    var p = panel.querySelector("section.tree");
                    while (p.firstChild) p.firstChild.remove();
                    var ul = document.createElement("ul");
                    ul.classList.add("layers");
                    p.appendChild(ul);
                    buildTree(ul, psd.tree());
                } // try
                catch (e) {
                    console.log(e);
                }; // catch

                setTimeout(function () {
                    try {
                        var img = psd.image.toPng();
                        while (main.firstChild) main.firstChild.remove();
                        main.appendChild(img);
                        img.removeAttribute("width");
                        img.removeAttribute("height");

                        var svg = document.createElementNS(NS_SVG, "svg");
                        svg.setAttribute("viewBox", "0 0 "+psd.header.width+" "+psd.header.height);
                        svg.setAttribute("version", "1.1");
                        svg.classList.add("p");
                        main.appendChild(svg);
                    } // try
                    catch (e) {
                        console.log(e);
                    }; // catch
                },0);

                document.body.classList.remove("loading");
                document.body.classList.add("file");
            }, function () {console.log("err");});
    }; // function loadFile

})();
