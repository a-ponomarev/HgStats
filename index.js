const reviewService = require('./review.js');

const width = document.body.clientWidth * 0.5 - 9;
const height = width;
const outerRadius = Math.min(width, height) / 2 - 90;
const innerRadius = outerRadius - 5;

var format = d3.format();

// The chord layout, for computing the angles of chords and groups.
var layout = d3.layout.chord()
    .sortGroups(d3.descending)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending)
    .padding(.04);

var colors = ["#dbe9d8", "#c2d4d8", "#f2efe8", "#b0aac2"];
var fill = d3.scale.ordinal()
    .domain(d3.range(colors.length))
    .range(colors);

// The arc generator, for the groups.
var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

// The chord generator (quadratic Bézier), for the chords.
var chord = d3.svg.chord()
    .radius(innerRadius);

function reloadData(from, to) {
    clearData();
    updateData(reviewService.getData(from, to));
}

function clearData(){
    d3.select("#data").html("");
}

function updateData(data) {
    data.forEach(d => d.valueOf = () => d.amount); // todo kill

    var roots = [...new Set(data.map(i => i.root))];

    roots.forEach((root, rootInd) => {
        var divRootId = `root${rootInd}`;

        d3.select("#data")
            .append("div")
            .attr("id", divRootId)
            .append("h1")
            .attr("class", "rootTitle")
            .text(root);

        var rootData = data.filter(i => i.root === root);

        // Square matrices, asynchronously loaded; reviews is the transpose of commits.
        var commitsToReview = [],
            reviewToCommits = [];

        var personByName = d3.map(),
            personIndex = -1,
            personByIndex = [];

        // Compute a unique index for each person.
        rootData.forEach(function(d) {
            if (personByName.has(d.author)) {
                d.author = personByName.get(d.author);
            } else {
                personByName.set(d.author, d.author = { name: d.author, index: ++personIndex });
            }

            if (personByName.has(d.review)) {
                d.review = personByName.get(d.review);
            } else {
                personByName.set(d.review, d.review = { name: d.review, index: ++personIndex });
            }
        });

        // Initialize a square matrix of commits and reviews.
        for (let i = 0; i <= personIndex; i++) {
            commitsToReview[i] = [];
            reviewToCommits[i] = [];
            for (let j = 0; j <= personIndex; j++) {
                commitsToReview[i][j] = 0;
                reviewToCommits[i][j] = 0;
            }
        }

        // Populate the matrices, and stash a map from index to person.
        rootData.forEach(function(d) {
            commitsToReview[d.author.index][d.review.index] = d;
            reviewToCommits[d.review.index][d.author.index] = d;
            personByIndex[d.author.index] = d.author;
            personByIndex[d.review.index] = d.review;
        });

        rootData.forEach(function(d) {
            d.amountBack = commitsToReview[d.review.index][d.author.index].amount | 0;
        });

        // Add an SVG element for each diagram, and translate the origin to the center.
        var svg = d3.select("#" + divRootId).selectAll("div")
            .data([commitsToReview, reviewToCommits])
            .enter().append("div")
            .attr("class", "diagram")
            .style("width", `${width}px`)
            .style("height", `${height}px`)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        // For each diagram…
        svg.each(function(matrix, j) {
            const svg = d3.select(this);

            // Compute the chord layout.
            layout.matrix(matrix);

            // Add chords.
            svg.selectAll(".chord")
                .data(layout.chords)
                .enter().append("path")
                .attr("class", "chord")
                .style("fill", d => fill(d.source.value.amount % colors.length))
                .style("stroke", d => d3.rgb(fill(d.source.value.amount % colors.length)).darker())
                .attr("d", chord)
                .append("title")
                .text(d => `${d.source.value.review.name} reviewed ${d.source.value.amount} times, ` +
                    `${d.source.value.author.name} ${d.source.value.amountBack} times`);

            // Add groups.
            const g = svg.selectAll(".group")
                .data(layout.groups)
                .enter()
                .append("g")
                .attr("class", "group");

            // Add the group arc.
            g.append("path")
                .style("fill", d => fill(personByIndex[d.index].amount % colors.length))
                .attr("id", d => `group${d.index}-${j}-${rootInd}`)
                .attr("d", arc)
                .on("mouseover", fade(svg, .1))
                .on("mouseout", fade(svg, 1))
                .append("title")
                .text(d => `${personByIndex[d.index].name} ${j ? "reviewed" : "was reviewed"} ${format(d.value)} times`);

            // Add the group label.
            g.append("svg:text")
                .each(d => d.angle = (d.startAngle + d.endAngle) / 2)
                .attr("dy", ".35em")
                .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
                .attr("transform", d =>
                    "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
                    "translate(" + (innerRadius + 10) + ")" +
                    (d.angle > Math.PI ? "rotate(180)" : ""))
                .text(d => personByIndex[d.index].name);
        });
    });
}

function fade(svg, opacity) {
    return function(g, i) {
        svg.selectAll(".chord")
            .filter(d => d.source.index != i && d.target.index != i)
            .transition()
            .style("opacity", opacity);
    }
}

$(function() {
    var start = moment().startOf('year');
    var end = moment();

    function cb(start, end) {
        $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        reloadData(start, end);
    }

    $('#reportrange').daterangepicker({
        startDate: start,
        endDate: end,
        ranges: {
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'Last 365 Days': [moment().subtract(364, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment()],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
            'This Year': [moment().startOf('year'), moment()],
            'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')],
            'Last 20 Years': [moment().subtract(20, 'year').startOf('year'), moment()],
        }
    }, cb);

    cb(start, end);
});