/*
Yaaiis interface
*/

window.addEventListener('message', (event) => {
    console.log(event.data);
    if (event.data.type !== 'yaaiis/message') {
        return;
    } else {

        for (let metadata of event.data.data.generationMetadata) {
            if (metadata.key === 'prompt') {
                gradioApp().querySelector("#txt2img_prompt textarea").value = metadata.val;
            }
            else if (metadata.key === 'negative prompt') {
                gradioApp().querySelector('#txt2img_neg_prompt textarea').value = metadata.val;
            }
            else if (metadata.key === 'steps') {
                gradioApp().querySelector('#txt2img_steps input').value = metadata.val;
            }
            else if (metadata.key === 'width') {
                gradioApp().querySelector('#txt2img_width input').value = metadata.val;
            }
            else if (metadata.key === 'height') {
                gradioApp().querySelector('#txt2img_height input').value = metadata.val;
            }
            else if (metadata.key === 'seed') {
                gradioApp().querySelector('#txt2img_seed input').value = metadata.val;
            }
            else if (metadata.key === 'model') {
                // document.querySelector('#setting_sd_model_checkpoint label select').value = metadata.val;
            }

            //dispatch value change on server
            //dispatch value change on server
            //searching for element inside gradio config
            let el = gradio_config.components.filter(c => c.props.elem_id == 'txt2img_height');


            // window.getEventListeners(gradioApp().querySelector('#txt2img_width input')).input[0].listener();
        }

    }
})

console.log('set yaaiis/message listener');