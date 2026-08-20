import React from 'react';

const companies = [
  {
    name: 'Microsoft',
    logo: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Flogos-world.net%2Fwp-content%2Fuploads%2F2020%2F09%2FMicrosoft-Logo-2012-present.jpg&f=1&nofb=1&ipt=aa4ca0960dc2c1b1efa56043a6ed33c1d02266880e82ad558a6c958e0154a293&ipo=images'
  },
  {
    name: 'Amazon',
    logo: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fhdqwalls.com%2Fwallpapers%2Famazon-4k-logo-qhd.jpg&f=1&nofb=1&ipt=d93b423c76b299630e29001e24bfe3145a7005f853729f2a1cc0f2a92179fec4&ipo=images'
  },
  {
    name: 'Google',
    logo: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.AfKMLf4rKX7EqOSAVpujIQHaEK%26pid%3DApi&f=1&ipt=fcb8b5a8395960ff06e4bc0e61bb28b9d225c475ea9664631d89eaa424a1c55c&ipo=images'
  },
  {
    name: 'Oracle',
    logo: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.5ghidMJV9MiyatcrVV-OMgHaHa%26pid%3DApi%26h%3D160&f=1&ipt=2df794d331fa1bbe4158aba28f5f48eb7b0655c1e3da38ecd232914979cc4e7f&ipo=images'
  },
  {
    name: 'Adobe',
    logo: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.DeId6RpwM-avm_kPulWfrAHaEK%26pid%3DApi%26h%3D160&f=1&ipt=00d5ac72097f66b65e4edf1c7740b968b42eda5ca6c884017cba237e776b67ea&ipo=images'
  },
  {
    name: 'Salesforce',
    logo: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.h71yObz05sO13XXrZDDVPwHaEK%26pid%3DApi%26h%3D160&f=1&ipt=8de1c9c88623efae6d522d2126cb634d2c05dc123f7ef314d9062196ac077666&ipo=images'
  },
  {
    name: 'Infosys',
    logo: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F024%2F806%2F527%2Flarge_2x%2Finfosys-logo-transparent-free-png.png&f=1&nofb=1&ipt=8b40a40ca6c1ed1ec512636cce4f87ad8ec19174f3bb52c7d452b8870c73df75&ipo=images'
  },
  {
    name: 'TCS',
    logo: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.lOkT7ikqI2NPAIBN776_7AHaEK%26pid%3DApi%26h%3D160&f=1&ipt=f508b5d7137e8490945128d4ea9383f43ce3ffd89d3aeac8ddacbe535e872705&ipo=images'
  },
  {
    name:'Cadence',
    logo:'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2F1000logos.net%2Fwp-content%2Fuploads%2F2020%2F08%2FCadence-Logo-360x225.jpg&f=1&nofb=1&ipt=36d163e022bfa5c4cd332e8feedc77d7b0d123cf86b5a3d1946e281d394cea0f'
  },
  {
    name:'ATOA',
    logo:'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ffinancialit.net%2Fsites%2Fdefault%2Ffiles%2Fatoa_0.png&f=1&nofb=1&ipt=8544af99d20104bb2fef133b284bbe1aac12734d0a421e08a675e058c30e9c36'
  },
  {
    name:'Vlinder',
    logo:'https://s3.ap-south-1.amazonaws.com/io.vlinder.public/vlinder-logo-with-title.png'
  },
  {
    name:'ZOHO',
    logo:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQp6Uvy-j6B7DvvGIoH2lFjKgyofVdv2vj1aQ&s'
  },
  {
    name:'IBM',
    logo:'  https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.researchgate.net%2Fpublication%2F348410758%2Ffigure%2Ffig3%2FAS%3A979140828217344%401610456773194%2FLogo-of-International-Business-Machines-Corporationhttps-wwwibmcom-cn-zhlnkm.jpg&f=1&nofb=1&ipt=fb4f7c11cef3d4ca8d1fa13ebd9981f0feac1d711403ab81d45ffc48340321ec'
  },
  {
    name:'JSW',
    logo:'  https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.2rrFHwB5U00OHBL9o4y79wHaDx%26pid%3DApi&f=1&ipt=58c05b302257a9ad31a87dd2033024469b7aca8248a589fb370fb0a80fc2958c'
  },
  {
    name:'Data Pattern',
    logo:'https://i0.wp.com/mrmoneyist.com/wp-content/uploads/2021/12/2201027174755294.jpg?w=1024&ssl=1'
  },

  {
    name:'Comcast',
    logo:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPIQEk3t1cSbvppmNf4S4woDTbd0eibFiE_g&s'
  },
  {
    name:'Cognizant',
    logo:'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fnews.cognizant.com%2Fimage%2Fcognizant-new-logo-400px.jpg&f=1&nofb=1&ipt=768301624dfc139e1db157ffe684809fc704215b512bfb45c9da3d73341d7ff7'
  },
  {
    name:'Brimma',
    logo:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFtUqYxYfijHKdGbwUbGaliUby2lGP9zPlGg&s'
  },

];

const CompaniesList = () => {
  return (
    <div className="w-full py-12">
      <h2 className="text-3xl font-bold text-[#003087] text-center mb-8">
        Companies Visited
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
        {companies.map((company, index) => (
          <div
            key={index}
            className="group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 p-6"
          >
            <img
              src={company.logo}
              alt={company.name}
              className="w-full h-auto object-contain max-h-20 transition-opacity duration-300 group-hover:opacity-80"
            />
            <div className="absolute inset-0 bg-[#003087] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"></div>
            <div className="text-center mt-4 text-[#003087] font-medium">
              {company.name}
            </div>


          </div>
        ))}
      </div>
    </div>
  );
};

export default CompaniesList;
