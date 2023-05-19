document.addEventListener("DOMContentLoaded", () => {

    // // Get all the keys and values stored in Chrome storage
    // chrome.storage.local.get(null, function (items) {
    //     // Create a dropdown menu
    //     const dropdown = document.getElementById('titles');
    //     for (const key in items) {
    //         const option = document.createElement('option');
    //         option.text = key;
    //         dropdown.add(option);
    //     }
    // });

    // document.getElementById('addDataButton').addEventListener('click', function () {
    //     const title = document.getElementById('title').value;
    //     const data = document.getElementById('message').value;

    //     chrome.storage.local.set({ [title]: data });

    //     chrome.runtime.sendMessage({ type: 'log', obj: data });

    //     const dropdown = document.getElementById('titles');
    //     const option = document.createElement('option');
    //     option.text = title;
    //     dropdown.add(option);
    // });

    // // Add an event listener to the "Print" button to retrieve the data and print it to the console
    // document.getElementById('fillFormButton').addEventListener('click', function () {
    //     const selectedTitle = document.getElementById('titles').value;
    //     chrome.storage.local.get([selectedTitle]).then((result) => {
    //         console.log("Value currently is " + result[selectedTitle]);
    //       });
    // });

    document.getElementById("fillFormButton").addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: 'log', obj: "Alhamdulillah, it works!" });

        // const selectedTitle = document.getElementById('titles').value;
        // const getLocalStorageValue = (key) => {
        //     return new Promise((resolve) => {
        //       chrome.storage.local.get([key], (result) => {
        //         resolve(result[key]);
        //       });
        //     });
        //   };

        // Use async/await to get the value from Chrome storage
        var messageValue = document.getElementById("message").value;
        chrome.runtime.sendMessage({ type: 'log', obj: messageValue });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    args: [messageValue],
                    function: handleForm
                },
                (results) => {
                    chrome.runtime.sendMessage({ type: 'log', obj: results });
                }
            );
        });
    });

    // document.getElementById("usePdfButton").addEventListener("click", async () => {
    //     chrome.runtime.sendMessage({ type: 'log', obj: "Alhamdulillah, it works!" });

    //     const pdfInput = document.getElementById('pdf-input');
    //     const file = pdfInput.files[0];

    //     if (!file) {
    //         alert('Please select a PDF file.');
    //         return;
    //     }

    //     const pdfData = new Uint8Array(await file.arrayBuffer());

    //     const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    //     const numPages = pdf.numPages;
    //     let messageValue = '';

    //     for (let i = 1; i <= numPages; i++) {
    //         const page = await pdf.getPage(i);
    //         const textContent = await page.getTextContent();
    //         const pageText = textContent.items.map(item => item.str).join(' ');
    //         extractedText += pageText + ' ';
    //     }

    //     chrome.runtime.sendMessage({ type: 'log', obj: messageValue });

    //     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //         chrome.scripting.executeScript(
    //             {
    //                 target: { tabId: tabs[0].id },
    //                 args: [messageValue],
    //                 function: handleForm
    //             },
    //             (results) => {
    //                 chrome.runtime.sendMessage({ type: 'log', obj: results });
    //             }
    //         );
    //     });
    // });

    function handleForm(messageValue) {
        var apiKey = "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";

        function getTextFromNode(node) {
            let text = '';
            if (node.nodeType === Node.TEXT_NODE) {
                text = node.textContent;
            } else {
                node.childNodes.forEach(child => {
                    text += getTextFromNode(child);
                });
            }
            return text;
        }

        function handleIFrames(doc) {

            doc.querySelectorAll('iframe').forEach(iframe => {
                const iWindow = iframe.contentWindow;

                handleSelects(iWindow.document);
                handleFieldSets(iWindow.document);
                handleInputsAndTextAreas(iWindow.document);
            });

        }

        function getAssociatedLabels(input, doc) {
            const labels = doc.querySelectorAll(`label[for="${input.id}"]`);
            const label = Array.from(labels).reduce((accumulator, label, index) => {
                const labelText = getTextFromNode(label).replace(/[^A-Za-z0-9 ]/g, '');
                return accumulator + labelText + (index < labels.length - 1 ? ' ' : '');
            }, '');
            const placeholder = input.placeholder.replace(/[^A-Za-z0-9 ]/g, '');
            const type = input.type;

            return label || placeholder || type;
        }

        function handleInputsAndTextAreas(doc) {

            doc.querySelectorAll('input, textarea').forEach(async input => {

                if (input.value.trim()) {
                    return;
                }

                if (["text", "email", "url", "tel"].includes(input.type) || input.tagName.toLowerCase() === 'textarea') {

                    var text = getAssociatedLabels(input, doc);
                    prompt = "The facts you need to know can be found within the pair of triple backticks \n ``` " + messageValue + " ``` \n I will now ask you a question based on the facts i just mentioned, keep the answer as short as possible. In case you are not sure of the answer, do not say i dont know but rather make up one \n\n Question: " + text + "?"
                    const response = await callGPT3API(prompt);
                    chrome.runtime.sendMessage({ type: 'log', obj: response });
                    if (response) {
                        input.value = response.replace("Answer: ", '').trim();
                    }

                } else if (input.type == "number") {

                    var text = getAssociatedLabels(input, doc);
                    prompt = "The facts you need to know can be found within the pair of triple backticks \n ``` " + messageValue + " ``` \n I will now ask you a question based on the facts i just mentioned, you answer with just a number. In case you are not sure of the answer, do not say i dont know but rather make up one \n\n Question: " + text + "?"
                    const response = await callGPT3API(prompt);
                    chrome.runtime.sendMessage({ type: 'log', obj: response });
                    if (response) {
                        input.value = response.replace("Answer: ", '').replace(/[^0-9]/g, '').trim();
                    }

                }

            });
        }

        function handleFieldSets(doc) {
            doc.querySelectorAll('fieldset').forEach(async fieldset => {
                const legend = fieldset.querySelector('legend').textContent;

                const radios = Array.from(fieldset.querySelectorAll('input[type="radio"]'));
                const radioResponded = radios.map(input => input.checked).some((value) => value);
                if (radioResponded) {
                    return;
                }

                const radioLabels = radios.map(input => fieldset.querySelector(`label[for="${input.id}"]`).textContent);
                const formattedRadioLabels = radioLabels.map((option, index) => `${index}. ${option}`).join(" \n");

                if (radioLabels.length > 0) {

                    prompt = "The facts you need to know can be found within the pair of triple backticks \n ``` " + messageValue + " ``` \n I will now ask you an MCQ question based on the facts i just mentioned, you answer with just the number associated with right option. In case you are not sure of the answer, do not say i dont know but rather make up one \n\n Question: " + legend + "? Options: " + formattedRadioLabels + " \n Number associated with right option:"

                    const response = await callGPT3API(prompt);
                    var index = response.match(/\d/) ? parseInt(response.match(/\d/)[0], 10) : 1;

                    if (index >= 0 && index < radios.length) {
                        radios[index].checked = true;
                    }

                }

                const checkboxes = Array.from(fieldset.querySelectorAll('input[type="checkbox"]'));
                const checkboxResponded = checkboxes.map(input => input.checked).some((value) => value);
                if (checkboxResponded) {
                    return;
                }
                const checkboxLabels = checkboxes.map(input => fieldset.querySelector(`label[for="${input.id}"]`).textContent);
                const formattedCheckBoxLabels = checkboxLabels.map((option, index) => `${index}. ${option}`).join(" \n");

                if (checkboxLabels.length > 0) {

                    prompt = "The facts you need to know can be found within the pair of triple backticks \n ``` " + messageValue + " ``` \n I will now ask you an MCQ question based on the facts i just mentioned, you answer with the numbers associated with right options separated by commas. In case you are not sure of the answer, do not say i dont know but rather make up one \n\n Question: " + legend + "? Options: " + formattedCheckBoxLabels + " \n Numbers associated with right options separated by commas:"

                    const response = await callGPT3API(prompt);
                    const options = response.replace(/\s/g, '').split(',').map(Number) || [1];

                    options.forEach(index => {
                        if (index >= 0 && index < checkboxes.length) {
                            checkboxes[index].checked = true;
                        }
                    });

                }
            });
        }

        function handleSelects(doc) {

            doc.querySelectorAll('select').forEach(async select => {

                if (select.selectedIndex != 0) {
                    return;
                }

                const labels = doc.querySelectorAll(`label[for="${select.id}"]`);
                const label = Array.from(labels).reduce((accumulator, label, index) => {
                    const labelText = getTextFromNode(label).replace(/[^A-Za-z0-9 ]/g, '');
                    return accumulator + labelText + (index < labels.length - 1 ? ' ' : '');
                }, '');

                const options = Array.from(select.querySelectorAll('option'));
                const optionTexts = options.map(option => option.textContent);
                const formattedOptionTexts = optionTexts.map((option, index) => `${index}. ${option}`).join(" \n");

                chrome.runtime.sendMessage({ type: 'log', obj: formattedOptionTexts });

                if (optionTexts.length > 0) {

                    prompt = "The facts you need to know can be found within the pair of triple backticks \n ``` " + messageValue + " ``` \n I will now ask you an MCQ question based on the facts i just mentioned, you answer with just the number associated with right option. In case you are not sure of the answer, do not say i dont know but rather make up one \n\n Question: " + label + "? Options: " + formattedOptionTexts + " \n Number associated with right option:"

                    chrome.runtime.sendMessage({ type: 'log', obj: prompt });

                    const response = await callGPT3API(prompt);
                    chrome.runtime.sendMessage({ type: 'log', obj: response });
                    var index = response.match(/\d+/) ? parseInt(response.match(/\d+/)[0], 10) : 1;
                    chrome.runtime.sendMessage({ type: 'log', obj: index });

                    if (index >= 0 && index < options.length) {
                        select.selectedIndex = index;
                    } else {
                        select.selectedIndex = 1;
                    }

                }

            })

        }


        async function callGPT3API(prompt) {
            var response = await fetch("https://api.openai.com/v1/completions", {
                body: JSON.stringify({
                    "model": "text-davinci-003",   // text-davinci-003
                    "prompt": prompt,
                    "temperature": 0,
                    "max_tokens": 50
                }
                ),
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
            })

            var data = await response.json();
            return data.choices[0].text;
        }



        handleInputsAndTextAreas(document)
        handleFieldSets(document)
        handleSelects(document)
        handleIFrames(document)

        return true;
    }
});

