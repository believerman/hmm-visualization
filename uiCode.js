var hmm, cy;

var probs, graphWidth, numOfStates;
var arrows;
var observations, observationAlphabet;
var initialProbs;
var transitionProbabilities;
var observationProbabilities;
var numOfObservations;
var defaultNumberOfStates = 2;
var autoMode = true;
var currentCol = -1;
var animating = false;
var defaults;
var forwardMode = true;
var prevNodeRow = -1;
var prevNodeCol = -1;

var selectedStateCol;

$(function () { // on dom ready
    hmm = cytoscape({
        container: document.getElementById('hmm'),

        style: cytoscape.stylesheet()
            .selector('node')
            .css({
                'content': 'data(id)',
                'border-color': 'black',
                'font-size': 8,
                'width': 30,
                'height': 30,
                'text-valign': 'center',
                'text-halign': 'center'
            })
            .selector('edge')
            .css({
                'target-arrow-shape': 'triangle',
                'width': 2,
                'line-color': '#ddd',
                'target-arrow-color': '#ddd',
                'line-color': 'data(color)',
                'target-arrow-color': 'data(color)'
            })
            .selector(':selected')
            .css({
                'background-color': '#61bffc',
                'line-color': '#61bffc',
                'target-arrow-color': '#61bffc',
                'transition-property': 'background-color, line-color, target-arrow-color',
                'transition-duration': '0.5s'
            }),

        layout: {
            name: 'preset',
            directed: true,
            roots: '#a',
            padding: 10
        },
//                 userPanningEnabled: true
    });

    cy = cytoscape({
        container: document.getElementById('cy'),

        style: cytoscape.stylesheet()
            .selector('node')
            .css({
                'content': 'data(id)',
                'font-size': 8,
                'width': 30,
                'height': 30,
                'text-valign': 'center',
                'text-halign': 'center'
            })
            .selector('edge')
            .css({
                'target-arrow-shape': 'triangle',
                'width': 2,
                'line-color': '#ddd',
                'target-arrow-color': '#ddd'
            })
            .selector('.highlighted')
            .css({
                'background-color': '#61bffc',
                'width': 'mapData(weight, -10, 0, 10, 100)',
                'line-color': '#61bffc',
                'target-arrow-color': '#61bffc',
                'transition-property': 'background-color, line-color, target-arrow-color',
                'transition-duration': '0.5s'
            })
            .selector('.highlighted-node')
            .css({
                'content': 'data(prob)',
                'background-color': '#61bffc',
                'width': 'mapData(weight, -10, 0, 10, 100)',
                'height': 'mapData(weight, -10, 0, 10, 100)',
                'line-color': '#61bffc',
                'target-arrow-color': '#61bffc',
                'transition-property': 'background-color, line-color, target-arrow-color',
                'transition-duration': '0.5s'
            })
            .selector('.highlighted-edge')
            .css({
                'background-color': '#61bffc',
                'width': 'mapData(weight, 0, 30, 1, 30)',
                'line-color': '#61bffc',
                'target-arrow-color': '#61bffc',
                'transition-property': 'background-color, line-color, target-arrow-color',
                'transition-duration': '0.5s'
            })
            .selector('.viterbi-highlighted-node')
            .css({
                'background-color': '#e67e22',
                'line-color': '#e67e22',
                'target-arrow-color': '#e67e22',
                'transition-property': 'background-color, line-color, target-arrow-color',
                'transition-duration': '0.5s'
            })
            .selector('.viterbi-highlighted-edge')
            .css({
                'background-color': '#e67e22',
                'line-color': '#e67e22',
                'target-arrow-color': '#e67e22',
                'transition-property': 'background-color, line-color, target-arrow-color',
                'transition-duration': '0.5s'
            })
            .selector('.edge-with-info')
            .css({
                'background-color': '#2ecc71',
                'line-color': '#2ecc71',
                'target-arrow-color': '#2ecc71',
                'content': 'data(edgeLabel)',
                'font-size': 8
            })
            .selector(':selected')
            .css({
                'background-color': '#2ecc71',
                'line-color': '#2ecc71',
                'target-arrow-color': '#2ecc71',
                'transition-property': 'background-color, line-color, target-arrow-color',
                'transition-duration': '0.5s'
            }),

        layout: {
            name: 'preset',
            directed: true,
            roots: '#a',
            padding: 10
        },
        userPanningEnabled: true
    });

    hmm.on('select', 'node', {foo: 'bar'}, function (evt) {
//        console.log( evt.data.foo ); // 'bar'

        var node = evt.cyTarget;
        selectedStateCol = node.data('column');
        userSelectedNode(node);
        console.log('tapped ' + node.id());
    });

    hmm.on('unselect', 'node', {foo: 'bar'}, function (evt) {
//         console.log( evt.data.foo ); // 'bar'

        var node = evt.cyTarget;
        if (hmm.elements(":selected").length == 0) {
            userUnSelectedNode(node);
        }

        console.log('tapped ' + node.id());
    });

    cy.on('select', '.highlighted-node', {foo: 'bar'}, function (evt) {
        //        console.log( evt.data.foo ); // 'bar'
        //Remove higlighted edge class from all.
        cy.edges('.edge-with-info').removeClass('edge-with-info');
        var node = evt.cyTarget;
        selectedStateCol = node.data('column');

        document.getElementById("NodeCalcInfo").innerHTML = node.data('compLabel');

        edges = cy.edges("[target = '" + node.data().id + "']");
        edges.addClass('edge-with-info');
        console.log('tapped ' + node.id());
    });

    cy.on('unselect', '.highlighted-node', {foo: 'bar'}, function (evt) {
        //        console.log( evt.data.foo ); // 'bar'
        //Remove higlighted edge class from all.
        cy.edges('.edge-with-info').removeClass('edge-with-info');
    });

    document.getElementById("numberOfStatesInput").value = defaultNumberOfStates;
    numOfStates = defaultNumberOfStates;

    observations = ['a', 'b', 'c', 'd', 'e', 'a', 'c', 'e'];
    observationAlphabet = ['a', 'b', 'c', 'd', 'e'];
    numOfObservations = observations.length;

    document.getElementById("observationsInput").value = observations.join(',');
    document.getElementById("observationAlphabet").value = observationAlphabet.join(',');

    defaults = getRandomStartProbabilities(numOfStates, observationAlphabet);

    initialProbs = defaults[0];
    transitionProbabilities = defaults[1];
    observationProbabilities = defaults[2];

    setOriginalState();

}); // on dom ready

function initUIElements() {
    autoMode = document.getElementById("autoModeCheckBox").value;
    document.getElementById("numberOfStatesInput").value = defaultNumberOfStates;
    numOfStates = defaultNumberOfStates;
    setOriginalState();
}

function setOriginalState() {
//    cy.nodes().removeClass('highlighted-node');
//    cy.edges().removeClass('highlighted-edge');

    cy.remove(cy.nodes());
    cy.remove(cy.edges());

    hmm.remove(hmm.elements());

    userUnSelectedNode();

    animating = false;

    currentCol = -1;
    setNavButtonStatus();

    if (forwardMode) {
        document.getElementById("forwardInfo").className = "visibleAlgorithmInfo";
        document.getElementById("viterbiInfo").className = "hiddenAlgorithmInfo";
        forwardResults = forward(initialProbs, transitionProbabilities, observationProbabilities, observations);
        probs = forwardResults[0];
        computations = forwardResults[1];
        arrows = forwardResults[2];
    } else {
        document.getElementById("viterbiInfo").className = "visibleAlgorithmInfo";
        document.getElementById("forwardInfo").className = "hiddenAlgorithmInfo";
        viterbiResult = viterbi(initialProbs, transitionProbabilities, observationProbabilities, observations);
        stateSequence = viterbiResult[0];
        bestStateSequenceProbability = viterbiResult[1];
        probs = viterbiResult[2];
        phi = viterbiResult[3];
        computations = viterbiResult[4];
        arrows = viterbiResult[5];
    }

    graphWidth = math.size(probs).subset(math.index(0));

    addNodes(probs, computations, numOfStates, graphWidth);
    addEdges();

    initHMM();

    displayInitProbs();

    cy.fit();
    hmm.fit();
}

function addNodes(probs, compStrings, height, width) {

    xi = 200;
    yi = 200;

    for (i = 0; i < width; i++) {
        for (j = 0; j < height; j++) {
            cy.add({
                group: "nodes",
                data: {
                    id: 'S' + j + 'T' + (i + 1),
                    prob: round(probs.subset(math.index(i, j)), 6),
                    weight: math.log(probs.subset(math.index(i, j))) / (numOfObservations * numOfStates / 20.0),
                    row: j,
                    column: i + 1,
                    compLabel: compStrings.subset(math.index(i, j))
                },
                position: {x: xi + (i + 1) * 100, y: yi + j * 100}
            });
        }
    }
}

function addEdges() {
    for (var i = 0; i < numOfObservations; i++) {
        var sourceNodes = cy.elements("node[column =" + i + "]");
        var nextCol = i + 1;
        var destNodes = cy.elements("node[column = " + nextCol + "]");

        for (var j = 0; j < sourceNodes.length; j++) {
            for (var k = 0; k < destNodes.length; k++) {
                cy.add({
                    group: "edges",
                    data: {
                        id: '' + sourceNodes[j].data().id + '' + destNodes[k].data().id,
                        weight: 1,
                        source: sourceNodes[j].data().id,
                        target: destNodes[k].data().id
                    }
                });
            }
        }
    }
}

function initHMM() {
    for (i = 0; i < numOfStates; i++) {
        hmm.add({
            group: "nodes",
            data: {id: 'S' + i, weight: 1, row: 0, column: i},
            position: {x: 100 + i * 100, y: 100}
        });
    }

    hmm.nodes().forEach(function (node, i, nodes) {
        hmm.nodes().forEach(function (node2) {
            hmm.add({
                group: "edges",
                data: {
                    id: '' + node.data().id + '' + node2.data().id,
                    weight: 1,
                    source: node.data().id,
                    target: node2.data().id,
                    color: getRandomColor()
                }
            });
        });
    });
}

function startAnimating() {
    setOriginalState();
    var i = 0;
    animating = true;

    var highlightColumnAuto = function () {
        if (!animating)
            return;
        currentCol = i;
        highlightColumn(i);

        if (i < numOfObservations && animating) {
            i++;
            setTimeout(highlightColumnAuto, 1000);
        } else {
            //Animation is done
            //Change button name to restart
            if (!forwardMode) {
                startAnimatingViterbi();
            }
            animating = false;
        }
    };

    highlightColumnAuto();

}

function highlightColumn(col) {
    var edges;
    var nodes = cy.elements("node[column =" + col + "]");
    nodes.addClass('highlighted-node');

    if (col > 0) {
        nodes.forEach(function (node) {
            edges = cy.edges("[target = '" + node.data().id + "']");
            edges.addClass('highlighted-edge');
        });
    }
}

function startAnimatingViterbi() {
//    setOriginalState(numOfStates);
    var i = numOfObservations;
    animating = true;

    var highlightNodeAuto = function () {
        currentCol = i;
        var row = stateSequence.subset(math.index(i - 1, 0));
        highlightNode(i, row);

        if (i > 1) {
            i--;
            setTimeout(highlightNodeAuto, 100);
        } else {
            //Animation is done
            //Change button name to restart
            prevNodeCol = -1;
            prevNodeRow = -1;
        }
    };

    highlightNodeAuto();

}

function highlightNode(col, row) {
    var edges;
    var node = cy.elements("node[column =" + col + "][ row =" + row + "]");
    node.addClass('viterbi-highlighted-node');

    if (col > 0) {
        if (prevNodeCol > 0 && prevNodeRow > -1) {
            var prevNode = cy.elements("node[column =" + prevNodeCol + "][ row =" + prevNodeRow + "]");
            edges = cy.edges("[target = '" + prevNode.data().id + "'][source = '" + node.data().id + "']");
            edges.addClass('viterbi-highlighted-edge');
        }
    }
    prevNodeCol = col;
    prevNodeRow = row;
}

function dehighlightColumn(col) {
    var edges;
    var nodes = cy.elements("node[column =" + col + "]");
    nodes.removeClass('highlighted-node');

    if (col > 0) {
        nodes.forEach(function (node) {
            edges = cy.edges("[target = '" + node.data().id + "']");
            edges.removeClass('highlighted-edge');
        });
    }
}

function displayInitProbs() {
    //display prob values
    var probString = "";
    hmm.nodes().forEach(function (node, i, nodes) {
        var sInitProbs = round(initialProbs.subset(math.index(0, node.data('column'))), 5);
        probString += node.data('id') + ":" + sInitProbs;
        if (i != nodes.length - 1)
            probString += ",";
    });
    document.getElementById("initialProbInput").value = probString;
}

/************UI EVENT HANDLERS***********/

function algorithmChanged() {
    var selectedIndex = document.getElementById("algorithmSelector").selectedIndex;
    //TODO: change this when there are more than two options
    forwardMode = selectedIndex == 0;

    setOriginalState();
}

function evaluateButtonPressed() {
    if (autoMode) {
        startAnimating();
    } else {
        setOriginalState();
    }
}

function observationAlphabetChanged() {
    var newObservationAlphabet = document.getElementById("observationAlphabet").value;
    observationAlphabet = newObservationAlphabet.split(',');

    defaults = getRandomStartProbabilities(numOfStates, observationAlphabet);
    initialProbs = defaults[0];
    transitionProbabilities = defaults[1];
    observationProbabilities = defaults[2];

    // Not updating other states, because we don't want to show an error message to the user every time.
}

function observationsChanged() {
    //TODO: Validate observations are all alphabets

    var newObservations = document.getElementById("observationsInput").value;

    observations = newObservations.split(',');
    numOfObservations = observations.length;

//    defaults = getFlatStartProbabilities(numOfStates, observations);
//    initialProbs = defaults[0];
//    transitionProbabilities = defaults[1];
//    observationProbabilities = defaults[2];

    try {
        setOriginalState();
    }
    catch (err) {
        alert("Incorrect input. Check observation probability is defined for each state!\n" + err);
    }

}

function initialProbChanged() {
    //read the new prob
    var newStateInPro = document.getElementById("initialProbInput").value;
    var sInPros = newStateInPro.split(",");

    var probSum = 0;

    for (i = 0; i < sInPros.length; i++) {
        var prob = parseFloat(sInPros[i].split(":")[1]);
        var state = parseFloat(sInPros[i].split(":")[0].split("")[1]);

        initialProbs.set([0, state], prob);
        probSum += prob;
//        math.subset(initialProbs, math.index(0, state), prob);
    }
    if (probSum == 1)
        setOriginalState();
    else
        alert("Initial Probability Sum should be one");
}

function observationProbChanged() {
    var newObsProbs = document.getElementById("observationProbInputs").value;
    var sObsPros = newObsProbs.split(",");

    for (i = 0; i < sObsPros.length; i++) {
        var prob = parseFloat(sObsPros[i].split(":")[1]);
        var state = sObsPros[i].split(":")[0];

        observationProbabilities[state].set([0, selectedStateCol], prob);
    }

    //TODO: add the new observation if it doesnt exist in the list

    setOriginalState();
}

function transProbChanged() {
    var newTransProbs = document.getElementById("transitionProbInputs").value;
    var stransPros = newTransProbs.split(",");

    if (numOfStates != stransPros.length) {
        alert("Incorrect input. Number if transition probabilities should be the same as number of states");
        return;
    }

    for (i = 0; i < stransPros.length; i++) {
        var prob = parseFloat(stransPros[i].split(":")[1]);
        var state = parseFloat(stransPros[i].split(":")[0].split("")[1]);

        transitionProbabilities.set([selectedStateCol, state], prob);
    }

    setOriginalState();

}

function numberOfStatesChanged() {
    //TODO: Validate if number and max limit

    numOfStates = parseInt(document.getElementById("numberOfStatesInput").value);

    defaults = getRandomStartProbabilities(numOfStates, observationAlphabet);
    initialProbs = defaults[0];
    transitionProbabilities = defaults[1];
    observationProbabilities = defaults[2];
    setOriginalState();
}

function autoModeChanged() {
    autoMode = document.getElementById("autoModeCheckBox").checked;

    setNavButtonStatus();
}

function backButtonClicked() {
    //Clear selection for previous row
    if (currentCol >= 0) {
        dehighlightColumn(currentCol--);
    }

    setNavButtonStatus();
}

function nextButtonClicked() {
    if (currentCol < numOfObservations) {
        highlightColumn(++currentCol);
    }

    if (!forwardMode && currentCol == numOfObservations - 1) {
        startAnimatingViterbi();
    }

    setNavButtonStatus();
}

function setNavButtonStatus() {
    //Enable and disable navigation buttons
    if (autoMode) {
        document.getElementById("backNavButton").className = "disabled";
        document.getElementById("forwardNavButton").className = "disabled";
    } else {
        document.getElementById("backNavButton").className = "active";
        document.getElementById("forwardNavButton").className = "active";
    }

    if (currentCol >= numOfObservations) {
        document.getElementById("forwardNavButton").className = "disabled";
    }
    else if (currentCol < 0) {
        document.getElementById("backNavButton").className = "disabled";
    } else {
        document.getElementById("backNavButton").className = "active";
        document.getElementById("forwardNavButton").className = "active";
    }
}

/**********CYTOSCAPE EVENTS**************/
function userSelectedNode(node) {
    document.getElementById("hmmSettingsInf").className = "hiddenHmmSettingsInfo";
    document.getElementById("hmmSettings").className = "visibleHmmSettings";

    var obsProbString = "";
    for (var i = 0; i < observations.length; i++) {

        var sObsProbs = round(observationProbabilities[observations[i]].subset(math.index(0, node.data('column'))), 5);
        if (obsProbString.indexOf(observations[i]) < 0) {
            obsProbString += observations[i] + ":" + sObsProbs;
            if (i != observations.length - 1) {
                obsProbString += ",";
            }
        }

    }
    document.getElementById("observationProbInputs").value = obsProbString;

    var sTransProbwidth = math.size(transitionProbabilities).subset(math.index(0));
    var straProbs = transitionProbabilities.subset(math.index(node.data('column'), [0, sTransProbwidth]));

    var trasString = "";
    for (i = 0; i < math.size(straProbs).subset(math.index(1)); i++) {
        trasString += "S" + i + ":" + round(straProbs.subset(math.index(0, i)), 5);
        if (i != math.size(straProbs).subset(math.index(1)) - 1) {
            trasString += ",";
        }
    }

    document.getElementById("transitionProbInputs").value = trasString;
}

function userUnSelectedNode(node) {
    document.getElementById("hmmSettingsInf").className = "visibleHmmSettingsInfo";
    document.getElementById("hmmSettings").className = "hiddenHmmSettings";
}

/************HELPER METHODS**************/

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function commaSeparatedList(matrix) {
    var string = "";
    for (i = 0; i < math.size(matrix).subset(math.index(1)); i++) {
        string += round(matrix.subset(math.index(0, i)), 5);
        if (i != math.size(matrix).subset(math.index(1)) - 1) {
            string += ",";
        }
    }

    return string;
}

function commaSeparatedListFromArray(array) {
    var string = "";
    for (i = 0; i < array.length; i++) {
        string += array[i];
        if (i != array.length - 1) {
            string += ",";
        }
    }

    return string;
}



