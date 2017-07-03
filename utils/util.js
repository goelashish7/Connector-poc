const faker = require('faker');
// Generates rich connector card.

module.exports.createTask = function (creator, desc) {
    var summary = creator + ' created a new task';
    var ret = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        'themeColor': '0076D7',
        'summary': summary,
        'sections': [{
            'activityTitle': summary,
            'activitySubtitle': 'Project Atlassian',
            'activityImage': `${process.env.HOST}/static/img/image${Math.floor(Math.random() * 9) + 1}.png`,
            'text': desc,
            'facts': [
                {
                    'name': 'Assigned to',
                    'value': 'Unassigned'
                }, {
                    'name': 'Due date',
                    'value': Date().toString()
                },
                {
                    'name': 'Status',
                    'value': 'Not started'
                }
            ],
        }],
        'potentialAction': [
            {
                "@type": "OpenUri",
                "name": "Go to Website",
                "targets": [
                    { "os": "default", "uri": "https://www.microsoft.com" }
                ]
            }
        ]
    }
    return ret;
}

module.exports.createTaskBold = function (creator, desc) {
    var summary = creator + ' created a new task';
    var ret = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        'themeColor': '0076D7',
        'summary': summary,
        'sections': [{
            'activityTitle': summary,
            'activitySubtitle': '**Project Atlassian**',
            'activityImage': `${process.env.HOST}/static/img/image${Math.floor(Math.random() * 9) + 1}.png`,
            'text': '**' + desc + '**',
            'facts': [
                {
                    'name': 'Assigned to',
                    'value': '**Unassigned**'
                }, {
                    'name': 'Due date',
                    'value': '**' + Date().toString() + '**'
                },
                {
                    'name': 'Status',
                    'value': '**Not started**'
                }
            ],
        }],
        'potentialAction': [
            {
                "@type": "OpenUri",
                "name": "Go to Website",
                "targets": [
                    { "os": "default", "uri": "https://www.microsoft.com" }
                ]
            }
        ]
    }
    return ret;
}

module.exports.assignTask = function (creator, desc, assignee) {
    var summary = creator + ' has assigned the task';
    var ret = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        'themeColor': '0076D7',
        'summary': summary,
        'sections': [{
            'activityTitle': summary,
            'activitySubtitle': 'Project Atlassian',
            'activityImage': `${process.env.HOST}/static/img/image${Math.floor(Math.random() * 9) + 1}.png`,
            'text': desc,
            'facts': [
                {
                    'name': 'Assigned to',
                    'value': assignee
                }, {
                    'name': 'Due date',
                    'value': Date().toString()
                },
                {
                    'name': 'Status',
                    'value': 'In Progress'
                }
            ],
        }],
        'potentialAction': [
            {
                "@type": "HttpPOST",
                "name": "Http Post Action",
                "target": "https://9d7f2eb5.ngrok.io/send"
            },
            {
                "@type": "OpenUri",
                "name": "Go to Website",
                "targets": [
                    { "os": "default", "uri": "https://www.microsoft.com" }
                ]
            },
            {
                "@type": "ActionCard",
                "name": "Add a note",
                "inputs": [
                    {
                        "@type": "TextInput",
                        "id": "comment",
                        "isMultiline": true,
                        "title": "Enter your note"
                    }
                ],
                "actions": [
                    {
                        "@type": "HttpPOST",
                        "name": "OK",
                        "target": "https://9d7f2eb5.ngrok.io/send",
                        "successMessage": "Your comment was successfully posted.",
                        "errorMessage": "Your comment couldn't be posted. Please try again."
                    }
                ]
            }

        ]
    }
    return ret;
}

module.exports.assignTaskBold = function (creator, desc, assignee) {
    var summary = creator + ' has assigned the task';
    var ret = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        'themeColor': '0076D7',
        'summary': summary,
        'sections': [{
            'activityTitle': summary,
            'activitySubtitle': '**Project Atlassian**',
            'activityImage': `${process.env.HOST}/static/img/image${Math.floor(Math.random() * 9) + 1}.png`,
            'text': '**' + desc + '**',
            'facts': [
                {
                    'name': 'Assigned to',
                    'value': '**' + assignee + '**'
                }, {
                    'name': 'Due date',
                    'value': '**' + Date().toString() + '**'
                },
                {
                    'name': 'Status',
                    'value': '**In Progress**'
                }
            ],
        }],
        'potentialAction': [
            {
                "@type": "HttpPOST",
                "name": "Http Post Action",
                "target": "https://9d7f2eb5.ngrok.io/send"
            },
            {
                "@type": "OpenUri",
                "name": "Go to Website",
                "targets": [
                    { "os": "default", "uri": "https://www.microsoft.com" }
                ]
            },
            {
                "@type": "ActionCard",
                "name": "Add a note",
                "inputs": [
                    {
                        "@type": "TextInput",
                        "id": "comment",
                        "isMultiline": true,
                        "title": "Enter your note"
                    }
                ],
                "actions": [
                    {
                        "@type": "HttpPOST",
                        "name": "OK",
                        "target": "https://9d7f2eb5.ngrok.io/send",
                        "successMessage": "Your comment was successfully posted.",
                        "errorMessage": "Your comment couldn't be posted. Please try again."
                    }
                ]
            }
        ]
    }
    return ret;
}

// Convenience method to strip out @ mentions from bot text
module.exports.getTextWithoutMentions = function (message) {
    var text = message.text;
    if (message.entities) {
        message.entities
            .filter(entity => entity.type === "mention")
            .forEach(entity => {
                text = text.replace(entity.text, "");
            });
        text = text.trim();
    }
    return text;
}

module.exports.createNotificationCard = function (guid, id, action, title, user, url, repo) {
    {
        var ret = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "summary": "Pull request " + id,
            "themeColor": "0078D7",
            "title": "Pull request " + action + " : " + title,
            "sections": [
                {
                    "activityTitle": user,
                    "activitySubtitle": "9/13/2016, 11:46am",
                    "activityImage": "http://connectorsdemo.azurewebsites.net/images/MSC12_Oscar_002.jpg",
                    "facts": [
                        {
                            "name": "Pull request #:",
                            "value": id
                        },
                        {
                            "name": "Action:",
                            "value": action
                        },
                        {
                            "name": "Repository:",
                            "value": repo
                        }
                    ],
                    "text": "Description of the pull request"
                }
            ],
            "potentialAction": [
                {
                    "@type": "ActionCard",
                    "name": "Add a comment",
                    "inputs": [
                        {
                            "@type": "TextInput",
                            "id": "comment",
                            "title": "Enter your comment",
                            "isMultiline": true
                        }
                    ],
                    "actions": [
                        {
                            "@type": "HttpPOST",
                            "name": "OK",
                            "target": "https://connector-poc.azurewebsites.net/send?id="+ guid,
                            	"successMessage": "Your comment was successfully posted.",
					"errorMessage": "Your comment couldn't be posted. Please try again."
                        }
                    ]
                },
                {
                    "@type": "HttpPOST",
                    "name": "Merge",
                    "target": "https://connector-poc.azurewebsites.net/send"
                },
                {
                    "@type": "HttpPOST",
                    "name": "Close",
                    "target": "https://connector-poc.azurewebsites.net/send"
                },
                {
                    "@type": "OpenUri",
                    "name": "View in GitHub",
                    "targets": [
                        { "os": "default", "uri": url }
                    ]
                }
            ]
        }
    }
    return ret;

}

// Generates random names
const names = ['Evangelina Gallagher', 'Jess Lamontagne', 'Darlene Solis', 'Linda Riley', 'Simone Suarez', 'Alfonso Troy', 'Gabriel Hendon'];
function getName() { return names[Math.floor(Math.random() * names.length)] }
module.exports.getName = getName;

// Generates random task titles
const titles = ['Create new tenant', 'Add new team members', 'Hire two new developers', 'Interview design candidates', 'Set up the project', 'Decide on project tools', 'Assign new tasks', 'Generate new leads', 'Meet with clients', 'Meet with the press', 'Sleep'];
function getTitle() { return titles[Math.floor(Math.random() * titles.length)] }
module.exports.getTitle = getTitle;