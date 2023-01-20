import {useRef} from "react";

function Browser(props) {

    const all = props.all;
    const eventBus = props.eventBus;

    const selected = useRef(null);

    eventBus.removeAllListeners('move');
    eventBus.on('move', (direction) => {
        if (selected.current == null) return;

        let index = all.map((item) => {return item.hash}).indexOf(selected.current.hash);

        if (direction === 'left' && index > 0) {
            index--;
        }
        else if (direction === 'right' && index < all.length-1) {
            index++;
        }

        select(all[index]);
    })

    const select = (imgData) => {

        selected.current = imgData;

        //send to viewer
        eventBus.emit('selectImage', selected.current);
        eventBus.emit('selectTabImage', selected.current);
    }

    return (
        <div style={{overflowY:'scroll'}}>
            {all.map((imgData) => {
                return (<img
                            loading="lazy"
                            draggable="true"
                            onDragStart={(e) => {
                                 console.log("onDragStart");
                                 e.dataTransfer.setData("text/plain", `img_${imgData.hash}`);
                                 const imgElement = new Image();
                                 imgElement.src = `http://localhost:6969/img/${imgData.hash}`
                                 e.dataTransfer.setDragImage(
                                     imgElement, 10, 10)
                            }}
                            key={imgData.hash}
                            onClick={() => select(imgData)}
                            width="100"
                            src={`http://localhost:6969/img/${imgData.hash}`} alt={imgData.hash}/>)
            })}
        </div>
    )
}

export default Browser;