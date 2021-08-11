var pageUrl = window.location.href
var leverParameter = ""
var trackingPrefix = "?lever-"

if (pageUrl.indexOf(trackingPrefix) >= 0) {
    // Found Lever parameter
    var pageUrlSplit = pageUrl.split(trackingPrefix)
    leverParameter = "?lever-" + pageUrlSplit[1]
}

let filterState = {
    department: "",
    location: "",
    // TODO: search box
    search: ""
}

let usStates = {
    "Alabama": true,
    "Alaska": true,
    "American Samoa": true,
    "Arizona": true,
    "Arkansas": true,
    "California": true,
    "Colorado": true,
    "Connecticut": true,
    "Delaware": true,
    "District Of Columbia": true,
    "Federated States Of Micronesia": true,
    "Florida": true,
    "Georgia": true,
    "Guam": true,
    "Hawaii": true,
    "Idaho": true,
    "Illinois": true,
    "Indiana": true,
    "Iowa": true,
    "Kansas": true,
    "Kentucky": true,
    "Louisiana": true,
    "Maine": true,
    "Marshall Islands": true,
    "Maryland": true,
    "Massachusetts": true,
    "Michigan": true,
    "Minnesota": true,
    "Mississippi": true,
    "Missouri": true,
    "Montana": true,
    "Nebraska": true,
    "Nevada": true,
    "New Hampshire": true,
    "New Jersey": true,
    "New Mexico": true,
    "New York": true,
    "North Carolina": true,
    "North Dakota": true,
    "Northern Mariana Islands": true,
    "Ohio": true,
    "Oklahoma": true,
    "Oregon": true,
    "Palau": true,
    "Pennsylvania": true,
    "Puerto Rico": true,
    "Rhode Island": true,
    "South Carolina": true,
    "South Dakota": true,
    "Tennessee": true,
    "Texas": true,
    "Utah": true,
    "Vermont": true,
    "Virgin Islands": true,
    "Virginia": true,
    "Washington": true,
    "West Virginia": true,
    "Wisconsin": true,
    "Wyoming": {}
}

let usStateLocationByIdMapping = {}
// TODO: change the format of location filter to be city, country

$(document).ready(async () => {

    // $jQuery methods go here...


    let url = "https://api.lever.co/v0/postings/bullhorn?group=team&mode=json"

    // Checking for potential Lever source or origin parameters
    // Fetching job postings from Lever's postings API
    let resp = await fetch(url)
    let data = await resp.json()

    // Normalize Data
    // {
    //     locations: {
    //         "location": ["id1", "id2"],
    //     },
    //     departments: {
    //         "department": ["id2", "id4"],
    //     },
    //     posts: [{}, {}]
    // }

    let postings = data.reduce((acc, next) => {
        const { postings } = next
        for (let i = 0; i < postings.length; i++) {
            let posting = postings[i]
            let { department, location } = posting.categories
            const postingId = posting.id

            const oldLoc = location
            location = location.split(/\s?,\s?/)

            if (location[1] in usStates) {
                location[1] = "United States"
            }

            location = location.join(", ")

            usStateLocationByIdMapping[postingId] = location

            // Mapping of all of the posts by id
            acc.posts[postingId] = posting

            // Mapping of all of the posts for a department
            if (department in acc.departments) {
                acc.departments[department].push(postingId)
            } else {
                acc.departments[department] = [postingId]
            }

            // Mapping of all of the posts for a location

            if (location in acc.locations) {
                acc.locations[location].push(postingId)
            } else {
                acc.locations[location] = [postingId]
            }

        }

        return acc
    }, { locations: {}, departments: {}, posts: {} })

    createJobsFromPostings(postings)
    activateButtonsFromPostings(".jobs-teams", "department", postings)
    activateButtonsFromPostings(".jobs-locations", "location", postings)

    //Search bar functionality
    //Get input element
    let filterInput = document.getElementById('filterInput')
    //Add event listener
    filterInput.addEventListener('keyup', filterNames(postings))
})


function activateButtonsFromPostings(selector, selectedJobsList, postings) {

    $(`select${selector}`).change(event => {
        event.preventDefault()

        let key = event.target.value

        filterState[selectedJobsList] = key

        updateHTMLAfterFilterState(postings)
    })
}

const updateHTMLAfterFilterState = (() => {
    return (postings) => {

        var jobs = $(".jobs-list")

        let posts = Object.keys(postings.posts).map((id) => {
            let post = postings.posts[id]

            // Find the mapping of the City, State that converted to City, Country this id done by looking up its id
            let locationCase = usStateLocationByIdMapping[id] === filterState.location
            let departmentCase = post.categories.department === filterState.department
            let searchCase = post.text.toLowerCase().includes(filterState.search.toLowerCase())

            // TODO: add a case to add back everything on the drop downs

            // Filter by inclusion all or none need to match

            if (filterState.search && filterState.location && filterState.department) {
                let keep = searchCase && locationCase && departmentCase
                return { id, keep }
            }
            if (filterState.search && filterState.location) {
                let keep = searchCase && locationCase
                return { id, keep }
            }
            if (filterState.department && filterState.location) {
                let keep = locationCase && departmentCase
                return { id, keep }
            }
            if (filterState.search && filterState.location) {
                let keep = searchCase && locationCase
                return { id, keep }
            }
            if (filterState.search && filterState.department) {
                let keep = searchCase && departmentCase
                return { id, keep }
            }
            if (filterState.location) {
                let keep = locationCase
                return { id, keep }
            }
            if (filterState.department) {
                let keep = departmentCase
                return { id, keep }
            }
            if (filterState.search) {
                let keep = searchCase
                return { id, keep }
            }

        })

        $("#numOfPosts").text(posts.filter(({ keep }) => keep).length)

        for (let obj of posts) {
            let { id, keep } = obj
            if (keep) {
                jobs.find(`.${id}`).fadeIn("fast")
            } else {
                jobs.find(`.${id}`).fadeOut("fast")
            }
        }
    }
})()

// Functions for checking if the variable is unspecified
function cleanString(string) {
    if (string) {
        var cleanString = string.replace(/[\s&,]+/gi, (str) => {
            switch (str) {
                case "&":
                    return "Amp"
                case ",":
                    return "-"
                default:
                    return ""
            }
        })
        return cleanString
    } else {
        return "Uncategorized"
    }
}

function nullCheck(string) {
    if (!string) {
        var result = "Uncategorized"
        return result
    } else {
        return string
    }
}

// CREATE JOBS START //

function createJobsFromPostings(postings) {

    // Create Options for departments
    for (var department in postings.departments) {

        var cleanStr = cleanString(nullCheck(department))

        let teamButton = `<option class="tags teamCategories">
                  <a href="#" class="btn departmentFilterBtn ${cleanStr}">
                    ${department}
                  </a>
        </option>`

        // Display all job departments in the .jobs-teams div
        $(".jobs-teams").append(teamButton)
    }

    // Create Options for locations
    for (var location in postings.locations) {

        var cleanStr = cleanString(nullCheck(location))

        let teamButton = `<option class="tags teamCategories btn departmentFilterBtn ${cleanStr}">
                    ${location}
        </option>`

        // Display all job locations in the .jobs-teams div
        $(".jobs-locations").append(teamButton)
    }

    // Create Listings of the Posts
    for (var id in postings.posts) {

        var posting = postings.posts[id]
        var id = posting.id
        var title = posting.text
        var description = nullCheck(posting.description)
        var shortDescription =
            $.trim(posting.descriptionPlain)
                .slice(1574)
                .substring(0, 250)
                .replace("\n", " ") + "..."

        var locationLabel = nullCheck(posting.categories.location)

        var departmentLabel = nullCheck(posting.categories.department)
        var additional = nullCheck(posting.additional)
        var applyLink = nullCheck(posting.applyUrl)

        //Append each job posting to the #jobs div
        $("#jobs").append(
            `<li class="job list-group-item jobListing ${id}">
                <ul style="padding-left: 0px !important;">
                    <li class="job-title list-group-item">
                        ${title}
                    </li>
                    <li class="tags">
                        <span class="department list-group-item">
                            <a style="color: #999;">
                                ${departmentLabel}
                            </a>
                        </span>
                    </li>
                    <li class="tags">
                        <span class="location list-group-item">
                            <a style="color: #999;">
                                ${locationLabel}
                            </a>
                        </span>
                    </li>
                    <li class="description">
                        <a>
                            ${shortDescription}
                        </a>
                    </li>
                    <li style="margin-top: 10px;">
                      <a type="button" class="btn btn-orange" data-toggle="modal" data-target="#${id}">
                        Learn More
                      </a>
                    </li>
                </ul>
            </li>
            
            <div class="modal fade" id="${id}" role="dialog">
              <div class="modal-dialog">
                  <div class="modal-content" style="min-width: 95vw !important;">
                      <div
                          style="max-width: 760px; margin: 0 auto; display: flex;justify-content: space-between; padding: 0 5px 0 0;">
                          <div class="modal-header">
                              <div class="navbar-header">
                                  <a href="https://www.bullhorn.com" class="navbar-brand">
                                  </a>
                              </div>
                          </div>
                          <button type="button" class="btn btn-secondary close" data-dismiss="modal"
                              style="font-weight: 700;">&times;</button>
                      </div>
                      <div style="display: flex; justify-content: space-between; max-width: 760px; margin: 0 auto;">
                          <h2 class="modal-title">${title}</h2>
                          <a href="${applyLink}" target="_blank">
                              <button type="button" class="btn btn-primary apply-button">APPLY FOR THIS JOB</button>
                          </a>
                      </div>
                      <div class="posting-categories" style="max-width: 760px; margin: 20px auto 40px;">
                          <p class="modal-tags"><span>${departmentLabel}</span></p>
                          <p class="modal-tags"><span>${locationLabel}</span></p>
                      </div>
                      <div class="modal-copy">
                          <div style="max-width: 760px; margin: 0 auto;">
                              <div class="modal-body">
                                  <div>
                                      <p style="padding-bottom: 20px;">${description}</p>
                                      <p style="padding-bottom: 20px;">${additional}</p>
                                  </div>
                              </div>
                              <div class="modal-footer">
                                  <a href="${applyLink}" target="_blank">
                                      <button type="button" class="btn btn-primary apply-button">APPLY FOR THIS JOB</button>
                                  </a>
                                  <button type="button" class="btn btn-secondary" data-dismiss="modal"
                                      style="font-weight: 700;">CLOSE</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>`
        )

    }

    // Count the total amount of jobs
    $(".totalJobs").append('<span><p id="numOfPosts">' + Object.keys(postings.posts).length + " jobs</p></span>")
}



const filterNames = (postings) => {
    return (event) => {
        // Get value of input
        filterState.search = event.target.value
        var str = event.target.value
        updateHTMLAfterFilterState(postings)
    }
}