<?php
/**
 * Class HP Custom Widget
 */
class Render_Field_Radio {

    /**
     * Undocumented function
     *
     * @param array $field_args
     * @return void
     */
    public function render( $field_args = [] ) 
    {

        $output = '';

        if ( isset ( $field_args['title'] ) ) {
            $widget_title = $field_args['title'];
        } else {
            $widget_title = __( 'Radio', 'HPmedia' );
        }

        if ( isset ( $field_args['id'] ) ) {
            $for = 'for="'.$field_args['id'].'"';
        } else {
            $for = 'for="'.$field_args['name'].'"';
        }

        if ( isset ( $field_args['id'] ) ) {
            $id = 'id="'.$field_args['id'].'"';
        } else {
            $id = 'id="'.$field_args['name'].'"';
        }

        if ( isset ( $field_args['class'] ) ) {
            $class = 'class="hp-custom-widget ref-field-radio '.$field_args['class'].'"';
        } else {
            $class = 'class="hp-custom-widget ref-field-radio"';
        }

        if ( isset ( $field_args['name'] ) ) {
            $name = 'name="'.$field_args['name'].'"';
        } else {
            $name = 'name=""';
        }

        if ( isset( $field_args['value'] ) && ! empty ( $field_args['value'] ) ) {
            $checked = esc_attr( $field_args['value'] );
        } else {
            $checked = '';
        }

        if ( isset( $field_args['placeholder'] ) ) {
            $placeholder = 'placeholder="'.esc_attr( $field_args['placeholder'] ).'"';
        } else {
            $placeholder = '';
        }

        if ( isset ( $field_args['column'] ) && $field_args['column'] == 1 ) {
            $style_clss = 'style="width: 100%;"';
        } elseif ( isset ( $field_args['column'] ) && $field_args['column'] == 2 ) {
            $style_clss = 'style="width: 50%;"';
        } elseif ( isset ( $field_args['column'] ) && $field_args['column'] == 3 ) {
            $style_clss = 'style="width: 33.3333%;"';
        } elseif ( isset ( $field_args['column'] ) && $field_args['column'] == 4 ) {
            $style_clss = 'style="width: 25%;"';
        } elseif ( isset ( $field_args['column'] ) && $field_args['column'] == 5 ) {
            $style_clss = 'style="width: 20%;"';
        } else {
            $style_clss = 'style="width: 25%;"';
        }

        $output .= '<div class="hp-widget-items render-field box-field-radio">';
        $output .= '<div class="box-field-title">';
        $output .= '<label '.$for.' class="txt-label field-text-label">';
        $output .=  $widget_title;
        $output .= '</label>';
        $output .= '</div>';
        $output .= '<div class="box-field-content">';
        if ( isset ( $field_args['radio'] ) && ! empty ( $field_args['radio'] ) ) {
            foreach ( $field_args['radio'] as $key => $item ) {

                if ( isset ( $field_args['id'] ) ) {
                    $for = $field_args['id'].'-'.sanitize_title( $item );
                } else {
                    $for = $field_args['name'].'-'.sanitize_title( $item );
                }

                $output .= '<div class="field-radio-item" '.$style_clss.'>';
                $output .= '<div class="radio-text">';
                if ( ! empty ( $checked ) && sanitize_title( $checked ) == sanitize_title( $key ) ) {
                    $output .= '<input type="radio" '.$class.' id="'.$for.'" '.$name.' value="'.esc_attr( $key ).'" '.$placeholder.' checked="checked" />';
                } else {
                    $output .= '<input type="radio" '.$class.' id="'.$for.'" '.$name.' value="'.esc_attr( $key ).'" '.$placeholder.' />';
                }
                $output .= '<label for="'.$for.'" class="txt-label item-text-label">'.esc_attr( $item ).'</label>';
                $output .= '</div>';
                $output .= '</div>';
            }
        }
        $output .= '</div>';
        $output .= '</div>';

        echo $output;

    }

    /**
     * Undocumented function
     *
     * @return void
     */
    public function get_docs() 
    {
        ?>
        <pre>
            <code>
            // Kiểm tra
            if ( isset( $instance[ 'radio' ] ) ) {
                $radio = $instance[ 'radio' ];
            } else {
                $radio = '';
            }

            // Gọi hàm
            hp_render_field_settings(
                [
                    'type'         => 'radio',
                    'name'         => $this->get_field_name( 'radio' ),
                    'id'           => $this->get_field_id( 'radio' ),
                    'value'        => $radio,
                    'title'        => __( 'Radio', 'HPmedia' ),
                    'placeholder'  => __( 'Chọn giá trị', 'HPmedia' ),
                    'radio' => [
                        'radio_1'  => __( 'Giá trị 1', 'HPmedia' ),
                        'radio_2'  => __( 'Giá trị 2', 'HPmedia' ),
                        'radio_3'  => __( 'Giá trị 3', 'HPmedia' ),
                    ],
                    'column'       => 4, // max 5
                    'docs'         => false,
                ]
            );

            // Cập nhật
            $instance['radio'] = hp_update_field_settings( $new_instance['radio'] );
            </code>
        </pre>
        <?php
    }

}
