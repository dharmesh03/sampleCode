import talentGem from "../assets/icons/talentgem.svg";

function Profile() {
  // const [value, setValue] = useState(0);

  // const handleChange = (event: React.SyntheticEvent, newValue: string) => {
  //   console.log("handleChange....", event, newValue);
  //   // setValue(newValue);
  // };
  return (
    <div className="flex flex-center flex-column m-auto w-512">
      <div className="container">
      <div className="m-b-20 text-center">
        <img src={talentGem} alt="" />
      </div>
      {/*<BasicTabs value={value} handleChange={handleChange}/>*/}
      </div>
    </div>
  );
}

export default Profile;
