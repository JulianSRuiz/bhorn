var pageUrl = window.location.href;
var leverParameter = "";
var trackingPrefix = "?lever-";

if (pageUrl.indexOf(trackingPrefix) >= 0) {
    // Found Lever parameter
    var pageUrlSplit = pageUrl.split(trackingPrefix);
    leverParameter = "?lever-" + pageUrlSplit[1];
}
// TODO: i don't know if this will affect the WP stuff
$(document).ready(function () {

    // $jQuery methods go here...

    var url = "https://api.lever.co/v0/postings/bullhorn?group=team&mode=json";

    //Checking for potential Lever source or origin parameters


    //Fetching job postings from Lever's postings API
    $.ajax({
        dataType: "json",
        url: url,
        success: function (data) {
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
                    const { department, location } = posting.categories
                    const postingId = posting.id
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

            createJobsFromPostings(postings);
            activateButtonsFromPostings(".jobs-teams", "departments", postings);
            activateButtonsFromPostings(".jobs-locations", "locations", postings);
        }
    });

    //Search bar functionality
    //Get input element
    let filterInput = document.getElementById('filterInput');
    //Add event listener
    filterInput.addEventListener('keyup', filterNames);

});


function alertMessage(results) {
    alert(results[0].text);
}


function activateButtonsFromPostings(selector, selectedJobsList, postings) {
    // TODO: check if the selected list is in the postings
    $(selector).on("click", "a", function (e) {
        e.preventDefault();
        var jobs = $(".jobs-list");

        for (let key in postings[selectedJobsList]) {
            key = cleanString(nullCheck(key))
            console.log("key", key)
            if ($(this).hasClass(key)) {
                if ($(this).hasClass("active")) {
                    $(this).removeClass("active");
                    jobs.find(".job").fadeIn("fast");
                } else {
                    $(".jobs-teams").find("a").removeClass("active");
                    $(this).addClass("active");
                    console.log("classes", jobs.find("." + key).attr("class"))
                    jobs.find("." + key).fadeIn("fast");
                    jobs
                        .find(".job")
                        .not("." + key)
                        .fadeOut("fast");
                }
            }

        }
    });
}


//Functions for checking if the variable is unspecified
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
        });
        return cleanString;
    } else {
        return "Uncategorized";
    }
}

function nullCheck(string) {
    if (!string) {
        var result = "Uncategorized";
        return result;
    } else {
        return string;
    }
}

//CREATE JOBS START//

function createJobsFromPostings(postings) {

    for (var department in postings.departments) {

        var cleanStr = cleanString(nullCheck(department));

        let teamButton = `<option class="tags teamCategories">
                  <a href="#" class="btn departmentFilterBtn ${cleanStr}">
                    ${department}
                  </a>
        </option>`        
        
        // let teamButton = `<p class="tags teamCategories" style="padding: 0px 20px; margin: 0px;">
        //     <span>
        //         <a href="#" class="btn departmentFilterBtn ${cleanStr}">
        //             ${department}
        //         </a>
        //     </span>
        // </p>`

        //Display all job departments in the .jobs-teams div
        $(".jobs-teams").append(teamButton);
    }

    for (var location in postings.locations) {

        // var team = nullCheck(id);
        // var department = "";
        var cleanStr = cleanString(nullCheck(location));

        // let teamButton = `<p class="tags teamCategories" style="padding: 0px 20px; margin: 0px;">
        //     <span>
        //         <a href="#" class="btn departmentFilterBtn ${cleanStr}">
        //             ${location}
        //         </a>
        //     </span>
        // </p>`

        let teamButton = `<option class="tags teamCategories btn departmentFilterBtn ${cleanStr}">
                    ${location}
        </option>` 

        //Display all job locations in the .jobs-teams div
        $(".jobs-locations").append(teamButton);
    }


    for (var id in postings.posts) {

        var posting = postings.posts[id];
        var id = posting.id;
        var title = posting.text;
        var description = nullCheck(posting.description)
        var shortDescription =
            $.trim(posting.descriptionPlain)
                .slice(1574)
                .substring(0, 250)
                .replace("\n", " ") + "...";

        var location = cleanString(nullCheck(posting.categories.location))
        var locationLabel = nullCheck(posting.categories.location)
        var commitment = cleanString(nullCheck(posting.categories.commitment))
        var team = cleanString(nullCheck(posting.categories.team))

        var department = cleanString(nullCheck(posting.categories.department))
        var departmentLabel = nullCheck(posting.categories.department)
        var additional = nullCheck(posting.additional)
        var applyLink = nullCheck(posting.applyUrl)

        //Append each job posting to the #jobs div
        $("#jobs").append(
            `<li class="job list-group-item jobListing ${team} ${location} ${commitment} ${department} ${id}">
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
        );

    }

    //Count the total amount of jobs
    $(".totalJobs").append('<p class="tags"><span>' + Object.keys(postings.posts).length + " jobs</span></p>");
}



function filterNames() {
    //Get value of input
    let filterValue = document.getElementById('filterInput').value.toUpperCase();

    //Get jobs ul
    let ul = document.getElementById('jobs');
    //Get li from ul
    let li = ul.querySelectorAll('li.list-group-item');

    //Loop through collection-item lis
    for (let i = 0; li.length; i++) {
        let a = li[i].getElementsByTagName('a')[0];
        //If matches
        if (a.innerText.toUpperCase().indexOf(filterValue) > -1) {
            li[i].style.display = '';
        } else {
            li[i].style.display = 'none';
        }
    }
}