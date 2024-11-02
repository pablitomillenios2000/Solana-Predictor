document.addEventListener("DOMContentLoaded", function () {
    const initialPrice = 166;
    const targetDate = new Date('2025-10-01');

    // Create UI for data entry
    const container = document.createElement('div');
    container.innerHTML = `
        <h3>Enter Date-Price Pairs</h3>
        <table id="dataTable">
            <tr>
                <th>Date (YYYY-MM-DD)</th>
                <th>Price ($)</th>
            </tr>
            <tr>
                <td><input type="date" value="2024-11-01" class="date-input"></td>
                <td><input type="number" value="${initialPrice}" class="price-input"></td>
            </tr>
        </table>
        <button id="addRow">Add Row</button>
        <button id="projectPrice">Project Price</button>
        <div id="output"></div>
        <div id="chart" style="width:100%;height:600px;"></div>
    `;
    document.body.appendChild(container);

    // Add event listener to add rows
    document.getElementById('addRow').addEventListener('click', function () {
        const table = document.getElementById('dataTable');
        const newRow = table.insertRow(-1);
        const dateCell = newRow.insertCell(0);
        const priceCell = newRow.insertCell(1);

        dateCell.innerHTML = `<input type="date" class="date-input">`;
        priceCell.innerHTML = `<input type="number" class="price-input">`;
    });

    // Add event listener to project price
    document.getElementById('projectPrice').addEventListener('click', function () {
        const dataPairs = [];
        const dateInputs = document.querySelectorAll('.date-input');
        const priceInputs = document.querySelectorAll('.price-input');

        for (let i = 0; i < dateInputs.length; i++) {
            const dateValue = dateInputs[i].value;
            const priceValue = parseFloat(priceInputs[i].value);

            if (dateValue && !isNaN(priceValue)) {
                dataPairs.push({ date: dateValue, price: priceValue });
            }
        }

        // Calculate the projection
        const projectedPrice = calculateProjection(dataPairs, targetDate);
        const output = document.getElementById('output');

        if (projectedPrice !== null && !isNaN(projectedPrice)) {
            output.innerHTML = `Projected SOL Price for ${targetDate.toDateString()}: $${projectedPrice.toFixed(2)}`;
            plotProjection(dataPairs, targetDate, projectedPrice);
        } else {
            output.innerHTML = "Projection could not be calculated. Please check the data pairs.";
        }
    });

    // Function to calculate the projected price
    function calculateProjection(dataPairs, targetDate) {
        if (dataPairs.length < 2) {
            console.log("Please provide at least two data points for accurate projection.");
            return null;
        }

        const datePrices = dataPairs.map(pair => ({
            date: new Date(pair.date).getTime(),
            price: pair.price
        }));

        datePrices.sort((a, b) => a.date - b.date);

        const n = datePrices.length;
        const sumX = datePrices.reduce((sum, dp) => sum + dp.date, 0);
        const sumY = datePrices.reduce((sum, dp) => sum + dp.price, 0);
        const sumXY = datePrices.reduce((sum, dp) => sum + dp.date * dp.price, 0);
        const sumX2 = datePrices.reduce((sum, dp) => sum + dp.date * dp.date, 0);

        const denominator = n * sumX2 - sumX * sumX;
        if (denominator === 0) {
            console.log("Error in calculation: denominator is zero.");
            return null;
        }

        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;

        const targetTimestamp = targetDate.getTime();
        return slope * targetTimestamp + intercept;
    }

    // Function to plot the projection using Plotly
    function plotProjection(dataPairs, targetDate, projectedPrice) {
        const dates = dataPairs.map(pair => new Date(pair.date));
        const prices = dataPairs.map(pair => pair.price);

        dates.push(targetDate);
        prices.push(projectedPrice);

        const trace = {
            x: dates,
            y: prices,
            mode: 'lines+markers',
            type: 'scatter',
            name: 'SOL Price Projection'
        };

        const layout = {
            title: 'SOL Price Projection',
            xaxis: { title: 'Date' },
            yaxis: { title: 'Price ($)' }
        };

        Plotly.newPlot('chart', [trace], layout);
    }
});
