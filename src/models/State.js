import { districtColors } from "../colors";
import { addLayers } from "../Map/map";
import { zeros } from "../utils";
import Election from "./Election";
import Part from "./Part";
import Population from "./Population";

function getParts(place) {
    let colors = districtColors.slice(0, place.numberOfParts);
    const parts = colors.map(
        color => new Part(color.id, "District", color.hex)
    );
    return parts;
}

function getPopulation(place) {
    return new Population(zeros(place.numberOfParts), place.population.total);
}

function getElections(place, layer) {
    return place.elections.map(
        election =>
            new Election(
                `${election.year} ${election.race} Election`,
                election.voteTotals,
                place.numberOfParts,
                layer
            )
    );
}

export default class State {
    constructor(map, place, id, assignment) {
        if (id) {
            this.id = id;
        } else {
            this.id = generateId(8);
        }

        this.placeId = place.id;

        this.initializeMapState(map, place);
        this.getInitialState(place, assignment);
        this.subscribers = [];

        this.update = this.update.bind(this);
        this.exportAsJSON = this.exportAsJSON.bind(this);
        this.render = this.render.bind(this);
    }
    initializeMapState(map, place) {
        map.fitBounds(place.bounds);
        const { units, unitsBorders, points } = addLayers(map, place.tilesets);

        this.units = units;
        this.unitsBorders = unitsBorders;
        this.layers = [units, points];
        this.map = map;
    }
    update(feature, part) {
        this.population.update(feature, part);
        this.elections.forEach(election => election.update(feature, part));
        this.assignment[feature.id] = part;
    }
    getInitialState(place, assignment) {
        this.parts = getParts(place);
        this.elections = getElections(place, this.units);
        this.population = getPopulation(place);
        this.assignment = {};
        if (assignment) {
            this.units.whenLoaded(() => {
                const features = this.units.query().reduce(
                    (lookup, feature) => ({
                        ...lookup,
                        [feature.id]: feature
                    }),
                    {}
                );
                // Q: Should we just keep this data around all the time?
                for (let unitId in assignment) {
                    this.update(features[unitId], assignment[unitId]);
                    this.units.setAssignment(unitId, assignment[unitId]);
                }
            });
        }
    }
    exportAsJSON() {
        const serialized = {
            assignment: this.assignment,
            id: this.id,
            placeId: this.placeId
        };
        const text = JSON.stringify(serialized);
        download(`districtr-plan-${this.id}.json`, text);
    }
    subscribe(f) {
        this.subscribers.push(f);
    }
    render() {
        for (let f of this.subscribers) {
            f();
        }
    }
}

function download(filename, text) {
    let element = document.createElement("a");
    element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

// Copied from stackoverflow https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function dec2hex(dec) {
    return ("0" + dec.toString(16)).substr(-2);
}

function generateId(len) {
    var arr = new Uint8Array((len || 40) / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, dec2hex).join("");
}
