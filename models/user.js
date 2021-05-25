const User = class user{
    constructor(user_name, user_id, email_address, birth_date, depot_list){
        this.user_name = user_name;
        this.email_address = email_address;
        this.user_id = user_id;
        this.birth_date = birth_date;
        this.depot_list = depot_list;
    }
}

module.exports = User