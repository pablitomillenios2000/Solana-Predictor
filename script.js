document.addEventListener("DOMContentLoaded", function () {
    const targetDate = new Date('2025-10-01');

    // Add event listener to add rows
    document.getElementById('addRow').addEventListener('click', function () {
        const table = document.getElementById('dataTable');
        const newRow = table.insertRow(-1);
        const dateCell = newRow.insertCell(0);
        const priceCell = newRow.insertCell(1);

        dateCell.innerHTML = `<input type="date" class="date-input">`;
        priceCell.innerHTML = `<input type="number" class="price-input">`;
    });

    // Add event listener to manually project price if data changes
    document.getElementById('projectPrice').addEventListener('click', runProjection);

    // Automatically run initial projection on page load
    runProjection();

    // Function to run projection and update the chart
    function runProjection() {
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
        const projectionData = calculateExponentialProjection(dataPairs, targetDate);
        const output = document.getElementById('output');

        if (projectionData && projectionData.length > 0) {
            const finalProjectedPrice = projectionData[projectionData.length - 1].price;
            output.innerHTML = `Projected SOL Price for ${targetDate.toDateString()}: $${finalProjectedPrice.toFixed(2)}`;
            plotProjection(projectionData);
        } else {
            output.innerHTML = "Projection could not be calculated. Please check the data pairs.";
        }
    }

    // Function to calculate exponential projection with daily points
    function calculateExponentialProjection(dataPairs, targetDate) {
        if (dataPairs.length < 2) {
            console.log("Please provide at least two data points for accurate projection.");
            return [];
        }

        const datePrices = dataPairs.map(pair => ({
            date: new Date(pair.date).getTime(),
            price: Math.log(pair.price)
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
            return [];
        }

        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;

        const startDate = new Date(datePrices[0].date);
        const interval = 24 * 60 * 60 * 1000; // 1-day interval
        const projectedData = [];

        for (let t = startDate.getTime(); t <= targetDate.getTime(); t += interval) {
            const logProjectedPrice = intercept + slope * t;
            projectedData.push({
                date: new Date(t),
                price: Math.exp(logProjectedPrice)
            });
        }

        const finalLogPrice = intercept + slope * targetDate.getTime();
        projectedData.push({
            date: targetDate,
            price: Math.exp(finalLogPrice)
        });

        return projectedData;
    }

    // Function to plot the projection using Plotly with daily points
    function plotProjection(projectionData) {
        const dates = projectionData.map(point => point.date);
        const prices = projectionData.map(point => point.price);

        const trace = {
            x: dates,
            y: prices,
            mode: 'lines+markers',
            type: 'scatter',
            name: 'SOL Price Projection',
            hovertemplate: 'Date: %{x}<br>Price: $%{y:.2f}<extra></extra>'
        };

        const layout = {
            title: 'SOL Price Projection with Daily Points',
            xaxis: {
                title: 'Date',
                tickformat: '%Y-%m-%d',
                dtick: 'M1',
            },
            yaxis: { title: 'Price ($)' }
        };

        Plotly.newPlot('chart', [trace], layout);
    }
});
