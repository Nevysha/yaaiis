import {useEffect, useState} from "react";

function ImgThumbnail(props) {

    const [isSelected, setIsSelected] = useState(props.isSelected);

    useEffect(() => {
        setIsSelected(props.isSelected);
    }, [props.isSelected])

    return <img
        key={props.imgData.hash}
        className={isSelected ? "img-selected" : ""}
        loading="lazy"
        draggable="true"
        onDragStart={props.onDragStart}

        onClick={props.onClick}
        width="100"
        src={`http://localhost:6969/img/${props.imgData.hash}`} alt={props.imgData.hash}/>;
}

function Browser(props) {

    const all = props.all;
    const eventBus = props.eventBus;

    const [selected, setSelected] = useState({});

    eventBus.removeAllListeners('move');
    eventBus.on('move', (direction) => {
        if (selected == null) return;

        let index = all.map((item) => {return item.hash}).indexOf(selected.hash);

        if (direction === 'left' && index > 0) {
            index--;
        }
        else if (direction === 'right' && index < all.length-1) {
            index++;
        }

        select(all[index]);
    })

    const select = (imgData) => {

        setSelected(imgData);

        //send to viewer
        eventBus.emit('selectImage', imgData);
        eventBus.emit('selectTabImage', imgData);
    }

    return (
        <div style={{overflowY:'scroll'}}>
            {all.map((imgData) => {
                return (
                    <ImgThumbnail
                        key={imgData.hash}
                        isSelected={selected.hash === imgData.hash}
                        imgData={imgData}
                        onDragStart={(e) => {
                            console.log("onDragStart");
                            e.dataTransfer.setData("text/plain", `img_${imgData.hash}`);
                            const imgElement = new Image();
                            imgElement.src = `http://localhost:6969/img/${imgData.hash}`
                            e.dataTransfer.setDragImage(
                                imgElement, 10, 10)
                        }}
                        onClick={() => select(imgData)}/>)
            })}
        </div>
    )
}

export default Browser;