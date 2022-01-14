function init() {
    generateEditRow();
    getData();
}


function generateEditRow() {
    editRow = document.createElement("tr");

    let nameCell = document.createElement("td");
    let countCell = document.createElement("td");
    let saveCell = document.createElement("td");
    let discardCell = document.createElement("td");

    editName = document.createElement("input");
    editCount = document.createElement("input");
    let saveBtn = document.createElement("button");
    let discardBtn = document.createElement("button");

    editCount.type = "number";
    saveBtn.innerText = "save";
    discardBtn.innerText = "discard";

    saveBtn.addEventListener("click", saveEdits);
    discardBtn.addEventListener("click", discardEdits);

    nameCell.appendChild(editName);
    countCell.appendChild(editCount);
    saveCell.appendChild(saveBtn);
    discardCell.appendChild(discardBtn);

    editRow.appendChild(nameCell);
    editRow.appendChild(countCell);
    editRow.appendChild(saveCell);
    editRow.appendChild(discardCell);
}


function getData() {
    let request = new XMLHttpRequest();
    request.open("GET", "/inventory", true);

    request.onload = function() {
        if (this.responseType == "json") {
            populate(this.response);
        } else {
            populate(JSON.parse(this.responseText));
        }
    }

    request.send();
}


function populate(obj) {
    let table = document.getElementById("table-data");
    
    let tbody = table.getElementsByTagName("tbody")[0];
    tbody.innerHTML = "";

    for (let line of obj) {
        tbody.appendChild(createEntry(line));
    }
}


function createEntry(entry) {
    let row = document.createElement("tr");
    let name = document.createElement("td");
    let count = document.createElement("td");
    let editCell = document.createElement("td");
    let deleteCell = document.createElement("td");
    let editBtn = document.createElement("button");
    let deleteBtn = document.createElement("button");

    editBtn.addEventListener("click", enterEditMode);
    deleteBtn.addEventListener("click", deleteEntry)

    name.innerText = entry.name;
    count.innerText = entry.count;
    editCell.appendChild(editBtn);
    deleteCell.appendChild(deleteBtn);

    editBtn.innerText = "edit";
    deleteBtn.innerText = "delete";

    row.id = "data-id-" + entry.id;

    row.appendChild(name);
    row.appendChild(count);
    row.appendChild(editCell);
    row.appendChild(deleteCell);

    return row;
}


function saveNew() {
    let data = {};

    data.name = document.getElementById("new-name").value;
    data.count = document.getElementById("new-count").value;
    
    let request = new XMLHttpRequest()
    request.open("PUT", "/inventory", true);
    request.setRequestHeader("Content-Type", "application/json");

    request.onreadystatechange = function() {
        if (request.readyState == request.DONE) {
            // TODO: Error handling
            
            let table = document.getElementById("table-data");
            let tbody = table.getElementsByTagName("tbody")[0];
            let data = {};
            if (this.responseType == "json") {
                data = this.response;
            } else {
                data = JSON.parse(this.responseText);
            }
            tbody.appendChild(createEntry(data));
        }
    }

    request.send(JSON.stringify(data));
}


function deleteEntry(evt) {
    let row = evt.target.parentNode.parentNode;
    let id = row.id.slice("data-id-".length);

    let request = new XMLHttpRequest();
    request.open("DELETE", `/inventory/${id}`);

    request.onload = function() {
        row.parentNode.removeChild(row)
    }

    request.send()
}


function discardEdits() {
    exitEditMode()
}


function saveEdits() {
    let id = oldRow.id.slice("data-id-".length);

    let oldName = oldRow.childNodes[0].innerText;
    let newName = editRow.childNodes[0].childNodes[0].value;

    let oldCount = oldRow.childNodes[1].innerText;
    let newCount = editRow.childNodes[1].childNodes[0].value;

    let changed = false;

    let data = {};

    if (oldName != newName) {
        data.name = newName;
        changed = true;
    }
    if (oldCount != newCount) {
        data.count = newCount;
        changed = true;
    }

    if (changed) {
        let request = new XMLHttpRequest();
        request.open("PUT", `/inventory/${id}`, true);
        request.setRequestHeader("Content-Type", "application/json");
    
        request.onreadystatechange = function() {
            if (request.readyState == request.DONE) {
                // TODO: Error handling
                oldRow.childNodes[0].innerText = newName;
                oldRow.childNodes[1].innerText = newCount;
                exitEditMode();
            }
        }

        request.send(JSON.stringify(data));
    } else {
        exitEditMode();
    }
}


function enterEditMode(evt) {
    if (oldRow) {
        exitEditMode()
    }

    let row = evt.target.parentNode.parentNode;
    
    editName.value = row.childNodes[0].textContent;
    editCount.value = row.childNodes[1].textContent;

    oldRow = row;

    row.parentNode.replaceChild(editRow, row);
}


function exitEditMode() {
    editRow.parentNode.replaceChild(oldRow, editRow);

    oldRow = null;
}


let editRow = null;
let editName = null;
let editCount = null;
let oldRow = null;

document.addEventListener("DOMContentLoaded", init);
