import { h } from 'preact';
import style from './style.css';


const InstanceUrl = (props) => {
    return <a href={props.url}>{props.url}</a>
};


export default InstanceUrl;
