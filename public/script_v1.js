function init() {
    generateEditRow();
    generateDeleteRow();
    getData();
    getDeletedData();
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
    discardBtn.addEventListener("click", discardChanges);

    nameCell.appendChild(editName);
    countCell.appendChild(editCount);
    saveCell.appendChild(saveBtn);
    discardCell.appendChild(discardBtn);

    editRow.appendChild(nameCell);
    editRow.appendChild(countCell);
    editRow.appendChild(saveCell);
    editRow.appendChild(discardCell);
}


function generateDeleteRow() {
    deleteRow = document.createElement("tr");

    let description = document.createElement("td");
    let commentCell = document.createElement("td");
    let deleteCell = document.createElement("td");
    let discardCell = document.createElement("td");

    deleteComment = document.createElement("input");
    let deleteBtn = document.createElement("button");
    let discardBtn = document.createElement("button");

    deleteBtn.innerText = "delete";
    discardBtn.innerText = "discard";

    deleteBtn.addEventListener("click", saveDelete);
    discardBtn.addEventListener("click", discardChanges);

    description.innerText = "Deletion comment:";
    description.style.fontWeight = "bold";
    commentCell.appendChild(deleteComment);
    deleteCell.appendChild(deleteBtn);
    discardCell.appendChild(discardBtn);

    deleteRow.appendChild(description);
    deleteRow.appendChild(commentCell);
    deleteRow.appendChild(deleteCell);
    deleteRow.appendChild(discardCell);
}


function handleError(request) {
    let response = {};

    if (this.responseType == "json") {
        response = request.response;
    } else {
        response = JSON.parse(request.responseText);
    }

    let errorBoxDiv = document.getElementById("error-box");
    let nameSpan = document.getElementById("error-name");
    nameSpan.innerText = response.name;

    if (response.hasOwnProperty("message")) {
        let messageSpan = document.getElementById("error-message");
        messageSpan.innerText = response.message;
    }

    errorBoxDiv.style.display = "block";
}


function hideErrorBox() {
    document.getElementById("error-box").style.display = "None";
}


function switchEntryTables(evt) {
    let normalTable = document.getElementById("table-data");
    let deletedTable = document.getElementById("table-data-deleted");
    let switchBtn = document.getElementById("btn-switch-tables");

    if (normalTable.style.display == "none") {
        getData();
        deletedTable.style.display = "none";
        normalTable.style.display = "block";
        switchBtn.innerText = "switch to deleted"
    } else {
        getDeletedData();
        normalTable.style.display = "none";
        deletedTable.style.display = "block";
        switchBtn.innerText = "switch to normal"
    }
}


function getData() {
    let request = new XMLHttpRequest();
    request.open("GET", "/inventory");

    request.onloadend = function() {
        if (request.status == 200) {
            if (this.responseType == "json") {
                populate(this.response);
            } else {
                populate(JSON.parse(this.responseText));
            }
        } else {
            handleError(request);
        }
    }

    request.send();
}


function getDeletedData() {
    let request = new XMLHttpRequest();
    request.open("GET", "/inventory/deleted");

    request.onloadend = function() {
        if (request.status == 200) {
            if (this.responseType == "json") {
                populateDeleted(this.response);
            } else {
                populateDeleted(JSON.parse(this.responseText));
            }
        } else {
            handleError(request);
        }
    }

    request.send()
}


function populate(obj) {
    let table = document.getElementById("table-data");
    
    let tbody = table.getElementsByTagName("tbody")[0];
    tbody.innerHTML = "";

    for (let line of obj) {
        tbody.appendChild(createEntry(line));
    }
}


function populateDeleted(obj) {
    let table = document.getElementById("table-data-deleted");

    let tbody = table.getElementsByTagName("tbody")[0];
    tbody.innerHTML = "";

    for (let line of obj) {
        tbody.appendChild(createDeletedEntry(line));
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
    deleteBtn.addEventListener("click", enterDeleteMode);

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


function createDeletedEntry(entry) {
    let row = document.createElement("tr");
    let name = document.createElement("td");
    let count = document.createElement("td");
    let comment = document.createElement("td");
    let restoreCell = document.createElement("td");
    let restoreBtn = document.createElement("button");

    restoreBtn.addEventListener("click", restore);

    name.innerText = entry.name;
    count.innerText = entry.count;
    comment.innerText = entry.comment;
    restoreCell.appendChild(restoreBtn);

    restoreBtn.innerText = "restore";

    row.id = "data-deleted-id-" + entry.id;

    row.appendChild(name);
    row.appendChild(count);
    row.appendChild(comment);
    row.appendChild(restoreCell);

    return row;
}


function saveNew() {
    let data = {};

    data.name = document.getElementById("new-name").value;
    data.count = document.getElementById("new-count").value;
    
    let request = new XMLHttpRequest()
    request.open("PUT", "/inventory");
    request.setRequestHeader("Content-Type", "application/json");

    request.onloadend = function() {
        if (request.status == 201) {
            let table = document.getElementById("table-data");
            let tbody = table.getElementsByTagName("tbody")[0];
            let data = {};
            if (this.responseType == "json") {
                data = this.response;
            } else {
                data = JSON.parse(this.responseText);
            }
            tbody.appendChild(createEntry(data));
        } else {
            handleError(request)
        }
    }

    request.send(JSON.stringify(data));
}


function deleteEntry(evt) {
    let row = evt.target.parentNode.parentNode;
    let id = row.id.slice("data-id-".length);

    let request = new XMLHttpRequest();
    request.open("DELETE", `/inventory/item/${id}`);

    request.onloadend = function() {
        if (request.status == 200) {
            row.parentNode.removeChild(row)
        } else {
            handleError(request);
        }
    }

    request.send()
}


function discardChanges() {
    exitChangeMode()
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
        request.open("PUT", `/inventory/item/${id}`);
        request.setRequestHeader("Content-Type", "application/json");
    
        request.onloadend = function() {
            if (request.status == 200) {
                oldRow.childNodes[0].innerText = newName;
                oldRow.childNodes[1].innerText = newCount;
                exitChangeMode();
            } else {
                handleError(request);
            }
        }

        request.send(JSON.stringify(data));
    } else {
        exitChangeMode();
    }
}


function saveDelete() {
    let id = oldRow.id.slice("data-id-".length);

    let comment = deleteRow.childNodes[1].childNodes[0].value;

    let data = {
        comment: comment
    };

    let request = new XMLHttpRequest();
    request.open("DELETE", `/inventory/item/${id}`);
    request.setRequestHeader("Content-Type", "application/json");

    request.onloadend = function() {
        if (request.status == 200) {
            oldRow = null;
            deleteRow.parentNode.removeChild(deleteRow);
        } else {
            handleError(request);
        }
    }

    request.send(JSON.stringify(data))
}


function restore(evt) {
    let row = evt.target.parentNode.parentNode;
    let id = row.id.slice("data-deleted-id-".length);

    let request = new XMLHttpRequest();
    request.open("PUT", "/inventory/item/" + id);

    request.onloadend = function() {
        if (request.status == 200) {
            row.parentNode.removeChild(row);
        } else {
            handleError(request);
        }
    }

    request.send()
}


function enterEditMode(evt) {
    if (oldRow) {
        exitChangeMode();
    }

    let row = evt.target.parentNode.parentNode;
    
    editName.value = row.childNodes[0].textContent;
    editCount.value = row.childNodes[1].textContent;

    oldRow = row;

    row.parentNode.replaceChild(editRow, row);
}


function enterDeleteMode(evt) {
    if (oldRow) {
        exitChangeMode();
    }

    oldRow = evt.target.parentNode.parentNode;

    oldRow.parentNode.replaceChild(deleteRow, oldRow);
}


function exitChangeMode() {
    if (editRow.parentNode) {
        editRow.parentNode.replaceChild(oldRow, editRow);
    }
    if (deleteRow.parentNode) {
        deleteRow.parentNode.replaceChild(oldRow, deleteRow);
    }

    oldRow = null;
}


let editRow = null;
let editName = null;
let editCount = null;
let oldRow = null;

let deleteRow = null;
let deleteComment = null;

document.addEventListener("DOMContentLoaded", init);
