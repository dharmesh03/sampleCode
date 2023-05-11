import TextTG from "../ui-component/TextTG/text-tg";
import CardsList from "../ui-component/CardsList/cards-list";
import { useNavigate } from "react-router-dom";

const items = [
    {
        _id: '231231',
        name: 'Google',
        status:'Active',
        location: 'United States',
        social: {linkedin: "https://linkedin.com",angelList: "https://angel.co",website:"https://en.wikipedia.org/wiki/Google"},
        skills: ['Web Development', 'PSD to HTML', 'Theme Development'],
        lastContacted: '2022-03-28 7:00 PM',
        jobClosed: 2,
        contacts: 3,
        jobActive: 2,
        phone: '+1-567-678-657'
    },
    {
        _id: '231231',
        name: 'Microsoft',
        status:'Prospect',
        location: 'United States',
        social: {linkedin: "https://linkedin.com",angelList: "https://angel.co",website:"https://en.wikipedia.org/wiki/Microsoft"},
        skills: ['Web Development', 'PSD to HTML', 'Theme Development'],
        lastContacted: '2022-03-28 7:00 PM',
        jobClosed: 2,
        contacts: 3,
        jobActive: 2,
        phone: '+1-567-678-657'
    },
    {
        _id: '231231',
        name: 'Yahoo',
        status:'Former Client',
        location: 'United States',
        social: {linkedin: "https://linkedin.com",angelList: "https://angel.co",website:"https://en.wikipedia.org/wiki/Yahoo!"},
        skills: ['Web Development', 'PSD to HTML', 'Theme Development'],
        lastContacted: '2022-03-28 7:00 PM',
        jobClosed: 2,
        contacts: 3,
        jobActive: 2,
        phone: '+1-567-678-657'
    },
    {
        _id: '231231',
        name: 'Amazon',
        status:'Former Client',
        location: 'United States',
        social: {linkedin: "https://linkedin.com",angelList: "https://angel.co",website:"https://en.wikipedia.org/wiki/Amazon_(company)"},
        skills: ['Web Development', 'PSD to HTML', 'Theme Development'],
        lastContacted: '2022-03-28 7:00 PM',
        jobClosed: 2,
        contacts: 3,
        jobActive: 2,
        phone: '+1-567-678-657'
    },
    {
        _id: '231231',
        name: 'IBM',
        status:'Prospect',
        location: 'United States',
        social: {linkedin: "https://linkedin.com",angelList: "https://angel.co",website:"https://en.wikipedia.org/wiki/IBM"},
        skills: ['Web Development', 'PSD to HTML', 'Theme Development'],
        lastContacted: '2022-03-28 7:00 PM',
        jobClosed: 2,
        contacts: 3,
        jobActive: 2,
        phone: '+1-567-678-657'
    },
]

function ListCandidates() {
    const navigate = useNavigate();
    return (
        <div>
            <CardsList title={'Companies'} total={items.length} items={items} nameField={'name'}
                       status={'status'}
                       locationField={'location'}
                       haveSelect={false}
                       socialField={'social'} chipsField={'skills'} dateField={'lastContacted'}
                       content={(item: any) => (<div className={'flex flex-column gap-5'}>
                           <TextTG type={'text'}>{item.phone}</TextTG>
                           <div className={'flex flex-wrap gap-5'}>
                               <div className={'flex flex-wrap gap-5'}>
                                   <TextTG type={'small-text'}>Active jobs</TextTG>
                                   <TextTG type={'small-text'} isPrimary={true}
                                           bold={true}>{item.jobActive}</TextTG>
                               </div>
                               <div className={'vertical-line'}/>
                               <div className={'flex flex-wrap gap-5'}>
                                   <TextTG type={'small-text'}>Closed jobs</TextTG>
                                   <TextTG type={'small-text'} isPrimary={true}
                                           bold={true}>{item.jobClosed}</TextTG>
                               </div>
                               <div className={'vertical-line'}/>
                               <div className={'flex flex-wrap gap-5'}>
                                   <TextTG type={'small-text'}>Contacts</TextTG>
                                   <TextTG type={'small-text'} isPrimary={true}
                                           bold={true}>{item.contacts}</TextTG>
                               </div>
                           </div>
                       </div>)}
                       actions={[
                           {
                               text: 'View Contacts',
                               onClick: (item: any) => {
                                   console.log(item)
                               }
                           },
                           {
                               text: 'View Company Profile',
                               onClick: (item: any) => {
                                   console.log(item)
                                   navigate('/dashboard/companies/profile')
                               }
                           }
                       ]}
            />
        </div>
    );
}

export default ListCandidates;
