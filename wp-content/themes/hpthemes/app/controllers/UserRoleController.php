<?php 
class UserRoles {
    
    private $wpRoles;

    public function __construct() {
        $this->wpRoles = new WP_Roles();
        // change name role
        //add_action( 'wp_roles_init', [ $this, 'change_name_roles' ] );
    }

    public function __init() {
        // xóa role
        //$this->wpRoles->remove_role( 'role key' );
        // add role
        //$this->wpRoles->add_role( 'role key', 'role name' );
    }

    public function change_name_roles( \WP_Roles $roles ) {
        //$roles->roles['customer']['name']  = 'role name';
    }
    
}