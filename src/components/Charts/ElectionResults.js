import { interpolateRdBu } from "d3-scale-chromatic";
import { html } from "lit-html";
import { roundToDecimal } from "../../utils";
import DataTable from "./DataTable";

function getCellStyle(percent, party) {
    if (party === "Democratic" && percent > 0.5) {
        return `background: ${interpolateRdBu(percent)}`;
    } else if (party === "Republican" && percent > 0.5) {
        return `background: ${interpolateRdBu(1 - percent)}`;
    }
    return `background: #f9f9f9`;
}

export default (election, parts) =>
    html`
        <h4>${election.name}</h4>
        ${
            DataTable(
                election.parties,
                parts,
                party => party,
                getCellStyle,
                election.percent,
                percent => roundToDecimal(percent * 100, 2)
            )
        }
    `;