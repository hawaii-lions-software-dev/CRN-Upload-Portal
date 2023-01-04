import React, { useState } from "react"
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Container,
} from "@mui/material";
import Swal from "sweetalert2";
import { app } from "../firebase";
import { getStorage, uploadBytes, ref } from "firebase/storage";


export default function Dashboard() {
  const storage = getStorage(app);
  const [imageUpload, setImageUpload] = useState(null);
  const [crnNumber, setCrnNumber] = useState("");
  const [cabinetMeetingDate, setCabinetMeetingDate] = useState("");

  const uploadImage = () => {
    if (cabinetMeetingDate === "") {
      Swal.fire(
        "Cabinet Meeting Date Not Found",
        "Please select the date of the Cabinet Meeting and try again",
        "error"
      );
      return;
    } else if (crnNumber === "") {
      Swal.fire(
        "CRN Number Not Selected",
        "Please select a CRN number and try again",
        "error"
      );
      return;
    } else if (imageUpload === null) {
      Swal.fire(
        "File not found",
        "Please select a file to upload and try again",
        "error"
      );
      return;
    } else if (imageUpload.length > 5) {
      Swal.fire(
        "File Limit Reached",
        "You are not allowed to submit more than 5 files for your CRN. Please contact the Hawaii Lions Information Technology Committee at information-technology@hawaiilions.org or Call Lion Kobey for IT Support at (808)542-7606 for assistance.",
        "error"
      );
    } else {
      for (let i = 0; i < imageUpload.length; i++) {
        const fileRef = ref(
          storage,
          `${cabinetMeetingDate}/${crnNumber}-${imageUpload[i].name}`
        );
        uploadBytes(fileRef, imageUpload[i]).then(() => {
          Swal.fire(
            "File Uploaded Successfully",
            "If you uploaded multiple files, this message will appear multiple times.",
            "success"
          );
        });
      }
    }
  };

  return (
    <>
      <Container
        className="align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        <Typography variant="h3" gutterBottom>
          District 50 Hawaii Lions CRN Report Submission
        </Typography>
        <Typography variant="body1" gutterBottom>
          Please select the Cabinet Meeting Date and CRN Number, then choose the
          file. Your upload will only be recieved if you press the "Upload File"
          button.
        </Typography>
        <br />
        <Typography variant="body1" gutterBottom>
          If you need help or have questions, please contact the Hawaii Lions
          Information Technology Committee at
          information-technology@hawaiilions.org or Call Lion Kobey for IT Support
          at (808)542-7606. Mahalo!
        </Typography>
        <br />
        <FormControl sx={{ m: 1, minWidth: 200 }} size="small">
          <InputLabel>Cabinet Meeting Date</InputLabel>
          <Select
            label="Cabinet Meeting Date"
            value={cabinetMeetingDate}
            onChange={(event) => {
              setCabinetMeetingDate(event.target.value);
            }}
          >
            <MenuItem value={"01-28-2023"}>1/28/2023</MenuItem>
          </Select>
        </FormControl>
        <br />
        <FormControl sx={{ m: 1, minWidth: 140 }} size="small">
          <InputLabel>CRN Number</InputLabel>
          <Select
            label="CRN Number"
            value={crnNumber}
            onChange={(event) => {
              setCrnNumber(event.target.value);
            }}
          >
            <MenuItem value={"1"}>1</MenuItem>
            <MenuItem value={"2"}>2</MenuItem>
            <MenuItem value={"3"}>3</MenuItem>
            <MenuItem value={"4"}>4</MenuItem>
            <MenuItem value={"5"}>5</MenuItem>
            <MenuItem value={"6"}>6</MenuItem>
            <MenuItem value={"7"}>7</MenuItem>
            <MenuItem value={"8"}>8</MenuItem>
            <MenuItem value={"9"}>9</MenuItem>
            <MenuItem value={"10"}>10</MenuItem>
            <MenuItem value={"11"}>11</MenuItem>
            <MenuItem value={"12"}>12</MenuItem>
            <MenuItem value={"13"}>13</MenuItem>
            <MenuItem value={"14"}>14</MenuItem>
            <MenuItem value={"15"}>15</MenuItem>
            <MenuItem value={"16"}>16</MenuItem>
            <MenuItem value={"17"}>17</MenuItem>
            <MenuItem value={"18"}>18</MenuItem>
            <MenuItem value={"19"}>19</MenuItem>
            <MenuItem value={"20"}>20</MenuItem>
            <MenuItem value={"21"}>21</MenuItem>
            <MenuItem value={"22"}>22</MenuItem>
            <MenuItem value={"23"}>23</MenuItem>
            <MenuItem value={"24"}>24</MenuItem>
            <MenuItem value={"25"}>25</MenuItem>
            <MenuItem value={"26"}>26</MenuItem>
            <MenuItem value={"27"}>27</MenuItem>
            <MenuItem value={"28"}>28</MenuItem>
            <MenuItem value={"29"}>29</MenuItem>
            <MenuItem value={"30"}>30</MenuItem>
            <MenuItem value={"31"}>31</MenuItem>
            <MenuItem value={"32"}>32</MenuItem>
            <MenuItem value={"33"}>33</MenuItem>
            <MenuItem value={"34"}>34</MenuItem>
            <MenuItem value={"35"}>35</MenuItem>
            <MenuItem value={"36"}>36</MenuItem>
            <MenuItem value={"37"}>37</MenuItem>
            <MenuItem value={"38"}>38</MenuItem>
            <MenuItem value={"39"}>39</MenuItem>
            <MenuItem value={"40"}>40</MenuItem>
            <MenuItem value={"41"}>41</MenuItem>
            <MenuItem value={"42"}>42</MenuItem>
            <MenuItem value={"43"}>43</MenuItem>
            <MenuItem value={"44"}>44</MenuItem>
            <MenuItem value={"45"}>45</MenuItem>
            <MenuItem value={"46"}>46</MenuItem>
            <MenuItem value={"47"}>47</MenuItem>
            <MenuItem value={"48"}>48</MenuItem>
            <MenuItem value={"49"}>49</MenuItem>
            <MenuItem value={"50"}>50</MenuItem>
            <MenuItem value={"51"}>51</MenuItem>
            <MenuItem value={"52"}>52</MenuItem>
            <MenuItem value={"53"}>53</MenuItem>
            <MenuItem value={"54"}>54</MenuItem>
            <MenuItem value={"55"}>55</MenuItem>
            <MenuItem value={"56"}>56</MenuItem>
            <MenuItem value={"57"}>57</MenuItem>
            <MenuItem value={"58"}>58</MenuItem>
            <MenuItem value={"59"}>59</MenuItem>
            <MenuItem value={"60"}>60</MenuItem>
            <MenuItem value={"61"}>61</MenuItem>
            <MenuItem value={"62"}>62</MenuItem>
            <MenuItem value={"63"}>63</MenuItem>
            <MenuItem value={"64"}>64</MenuItem>
            <MenuItem value={"65"}>65</MenuItem>
            <MenuItem value={"66"}>66</MenuItem>
            <MenuItem value={"67"}>67</MenuItem>
            <MenuItem value={"68"}>68</MenuItem>
            <MenuItem value={"69"}>69</MenuItem>
            <MenuItem value={"70"}>70</MenuItem>
          </Select>
        </FormControl>
        <br />
        <Button variant="outlined" component="label">
          Choose File
          <input
            type="file"
            hidden
            multiple={true}
            onChange={(event) => {
              setImageUpload(event.target.files);
            }}
          />
        </Button>
        <br />
        <br />
        <Button variant="outlined" onClick={uploadImage}>
          Submit
        </Button>
      </Container>
    </>
  )
}
