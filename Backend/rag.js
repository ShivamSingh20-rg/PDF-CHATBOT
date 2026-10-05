import "dotenv/config";


import { preparePDF} from './prepare.js';


const filepath  = './syllabus.pdf';


 await preparePDF(filepath);

 