// ==UserScript==
// @name         BMO transactions exporter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  BMO doesn't allow to export data beyond 2 months but they still show it to you via an HTML table. Brilliant. How about export it anyway?
// @author       Michele Porelli
// @match        https://www1.bmo.com/banking/digital/account-details/ba/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bmo.com
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js
// @updateURL    https://github.com/porelli/greasemonkey-scripts/blob/main/bmo-transactions-exporter.user.js
// @downloadURL  https://github.com/porelli/greasemonkey-scripts/blob/main/bmo-transactions-exporter.user.js
// @grant        none
// ==/UserScript==

// Credits to igorlogius for original script: https://greasyfork.org/en/scripts/411199-download-table-as-csv/code

function startScript() {
    console.log('table element has arrived!')

	// simulate click event
	function simulateClick(elem) {
		var evt = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			view: window
		});
		var canceled = !elem.dispatchEvent(evt);
	}

	// get closest table parent
	function getTableParent(node){
		while ( node = node.parentNode,
			node !== null && node.tagName !== 'TABLE' );
		return node;
	}

	// assemble csv data
	function getTblData(tbl){
		// csv store
		var csv = [];
		// get all rows inside the table
		tbl.querySelectorAll('tr').forEach(function(trRow) {
			// Only process direct tr children
			if( ! tbl.isEqualNode(getTableParent(trRow))){
				return;
			}
			// assemble row content
			var row = [];
			trRow.querySelectorAll('td, th').forEach(function(col) {
				// remove multiple spaces and linebreaks (breaks csv)
				var data = col.innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ')
				// escape double-quote with double-double-quote
				data = data.replace(/"/g, '""');
                // remove dollar signs, random pluses and commas from amount
                const is_amount = ['-$', '- $', '$', '+ $','+$'].some((word) => data.startsWith(word));
                if (is_amount) {
                    data = data.replace(/(\$|,|\+)/gm, '').replace(/(\s)/gm, '');
                }

				row.push('"' + data + '"');
			});
			csv.push(row.join(','));
		});
		return csv.join('\n');
	}

	// add button + click action
	function add_btn(){
		var btn = document.createElement('button');
		btn.innerHTML = 'Download Table as CSV';
		btn.setAttribute('type', 'button');
		// Process Table on Click
		btn.onclick = function() {
            var tbl = document.querySelectorAll('app-bank-account-transactions table')[0];
            console.log('processing table:');
            console.log(tbl);
			var csv_string = getTblData(tbl);
			csvlink.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
			simulateClick(csvlink);
		};
		// Insert before Table
        var header = document.querySelectorAll('app-bank-account-transactions')[0];
		header.parentNode.insertBefore(btn,header);
	}


	/* *
	 * M A I N
	 * */

	// add link
	var csvlink = document.createElement('a');
	csvlink.style.display = 'none';
	csvlink.setAttribute('target', '_blank');
	csvlink.setAttribute('download', 'data.csv');
	document.body.append(csvlink);

    console.log(document.querySelectorAll('table'))

	// add button
	add_btn();
}

(function(){
    console.log('export script is starting!')

    waitForKeyElements("app-transaction-table", startScript);
}());
