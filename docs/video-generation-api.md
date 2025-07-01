# Create Task

# File Upload API

# Ephemeral Resource Upload API

## Overview
This API allows you to upload temporary files that will be automatically deleted after 24 hours. **This API is Free of charge for Creator/Pro Plan**. If you are on Free plan, you can not use it. 

## Base URL
```
https://upload.theapi.app
```

## Authentication
- Authentication is required via API key
- Must be on the Creator plan or higher
- Add your API key to the request headers as `x-api-key`

## Endpoint: Upload Temporary File
Upload a file that will be automatically deleted after 24 hours.

### HTTP Request
`POST /api/ephemeral_resource`

### Headers
| Header        | Value            | Description                |
|---------------|------------------|----------------------------|
| Content-Type  | application/json | Request body format        |
| x-api-key     | YOUR_API_KEY     | Your API authentication key|

### Request Body Parameters
| Parameter  | Type   | Required | Description                                                                                       |
|------------|--------|----------|---------------------------------------------------------------------------------------------------|
| file_name  | string | Yes      | Name of the file with extension (max 128 characters)                                               |
| file_data  | string | Yes      | Base64 encoded file data. Can include data URI if it matches the file's content type (max 10MB)    |

### Supported File Extensions
The following file extensions are supported (case-insensitive):
1. jpg
2. jpeg
3. png
4. webp
5. mp4
6. wav
7. mp3

### File Name Requirements
- Must not be empty
- Must include one of the supported extensions
- Maximum length: 128 characters
- Extensions are case-insensitive

### File Data Requirements
- Must be provided as a base64 string
- Maximum size: 10MB
- Optional data URI is supported
- If data URI is included, its content-type must match the file extension's content-type

### Example Request

```bash
curl --location 'https://upload.theapi.app/api/ephemeral_resource' \
--header 'x-api-key: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
    "file_name": "hello.png",
    "file_data": "base64_encoded_data_here"
}'
```

### Success Response
A successful request will return a 200 status code with the following response structure:

```json
{
  "code": 200,
  "data": {
    "url": "https://example.com/example.png"
  },
  "message": "success"
}
```

### Error Responses

#### Invalid Request (400)
Returned when the request parameters are invalid (e.g., unsupported file type, file too large).

```json
{
  "code": 400,
  "message": "Invalid request parameters"
}
```

#### Insufficient Permissions (403)
Returned when the user's plan level is insufficient (requires Creator plan or higher).

```json
{
  "code": 403,
  "message": "Insufficient plan level"
}
```

### Important Notes
1. Uploaded files are automatically deleted after 24 hours
2. The service requires a Creator plan or higher
3. The file_data field can include a data URI, but if included, its content-type must match the file extension's expected content-type
4. File names are validated for supported extensions in a case-insensitive manner

### Additional Examples

#### Example with JPG file
```bash
curl --location 'https://upload.theapi.app/api/ephemeral_resource' \
--header 'x-api-key: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
    "file_name": "photo.jpg",
    "file_data": "base64_encoded_data_here"
}'
```

#### Example with MP3 file
```bash
curl --location 'https://upload.theapi.app/api/ephemeral_resource' \
--header 'x-api-key: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
    "file_name": "song.mp3",
    "file_data": "base64_encoded_data_here"
}'
```

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/v1/task:
    post:
      summary: Create Task
      deprecated: false
      description: >-
        This is provided as part of the [Kling API](https://piapi.ai/kling-api)
        from PiAPI. 

        This service allows you access to APIs for the most advanced video
        generation model - **Kuaishou's KlingAI**.

        You can create Text-to-video, Image-to-video, Extend video, Lipsync task
        and Effects task through this endpoint.

        :::info
          
        #### Text-to-video vs Image-to-video

        1. If the parameter `image_url` is left null then the task would be a
        text-to-video task; if filled out, then the task would be an
        image-to-video task. 



        #### About version 1.5 1.6 2.0 2.1 and 2.1-master

        The V1.5/1.6 model through the API currently has all the features and
        constraints as per klingai.com

        pricing for 2.1 is the same as 1.6

        pricing for 2.0/2.1-master: 2.0-pro-5s: USD0.96/generation, 2.0-pro-10s:
        USD1.92/generation


        #### Video Lengths

        For the video lengths (5s vs 10s) of the API-generated-videos for each
        model (1.0 1.5 1.6 2.0 2.1 and 2.1-master) and modes (std vs pro)
        combination, please refer to what is allowed on klingai.com; the API
        currently aligns with the website. 


        :::
      operationId: kling-api/create-task
      tags:
        - Endpoints/Kling
      parameters:
        - name: x-api-key
          in: header
          description: Your API Key used for request authorization
          required: true
          example: ''
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                model:
                  type: string
                  description: the model name
                  enum:
                    - kling
                  x-apidog-enum:
                    - value: kling
                      name: ''
                      description: ''
                task_type:
                  type: string
                  description: >-
                    type of the task. If you want to extend video,set to
                    `extend_video` and include `origin_task_id` filed in
                    `input`; if you want lipsync, use `lip_sync` and include
                    `origin_task_id` in `input`
                  enum:
                    - video_generation
                    - extend_video
                    - lip_sync
                    - effects
                  x-apidog-enum:
                    - value: video_generation
                      name: ''
                      description: ''
                    - value: extend_video
                      name: ''
                      description: ''
                    - value: lip_sync
                      name: ''
                      description: ''
                    - value: effects
                      name: ''
                      description: see [Effects](/docs/kling-api/kling-effects)
                input:
                  type: object
                  properties:
                    prompt:
                      type: string
                      maxLength: 2500
                    negative_prompt:
                      type: string
                      maxLength: 2500
                    cfg_scale:
                      type: string
                      description: >-
                        float between 0 and 1, it is strongly recommended to use
                        0.5
                    duration:
                      type: integer
                      enum:
                        - 5
                        - 10
                      x-apidog-enum:
                        - value: 5
                          name: ''
                          description: ''
                        - value: 10
                          name: ''
                          description: ''
                    aspect_ratio:
                      type: string
                      enum:
                        - '16:9'
                        - '9:16'
                        - '1:1'
                      x-apidog-enum:
                        - value: '16:9'
                          name: ''
                          description: ''
                        - value: '9:16'
                          name: ''
                          description: ''
                        - value: '1:1'
                          name: ''
                          description: ''
                      description: only required in text-to-video task
                    camera_control:
                      type: object
                      properties:
                        type:
                          type: string
                        config:
                          type: object
                          properties:
                            horizontal:
                              type: integer
                            vertical:
                              type: integer
                            pan:
                              type: integer
                            tilt:
                              type: integer
                            roll:
                              type: integer
                            zoom:
                              type: integer
                          required:
                            - horizontal
                            - vertical
                            - pan
                            - tilt
                            - roll
                            - zoom
                          x-apidog-orders:
                            - horizontal
                            - vertical
                            - pan
                            - tilt
                            - roll
                            - zoom
                          x-apidog-ignore-properties: []
                      required:
                        - type
                        - config
                      x-apidog-orders:
                        - type
                        - config
                      x-apidog-ignore-properties: []
                    mode:
                      type: string
                      enum:
                        - std
                        - pro
                      x-apidog-enum:
                        - value: std
                          name: ''
                          description: ''
                        - value: pro
                          name: ''
                          description: ''
                    version:
                      type: string
                      description: 'the model version '
                      enum:
                        - '1.0'
                        - '1.5'
                        - '1.6'
                        - '2.0'
                        - '2.1'
                        - 2.1-master
                      x-apidog-enum:
                        - value: '1.0'
                          name: ''
                          description: ''
                        - value: '1.5'
                          name: ''
                          description: ''
                        - value: '1.6'
                          name: ''
                          description: ''
                        - value: '2.0'
                          name: ''
                          description: only in pro mode
                        - value: '2.1'
                          name: ''
                          description: ''
                        - value: 2.1-master
                          name: ''
                          description: only in pro
                    image_url:
                      type: string
                      description: >-
                        Only required in image-to-video task. Initial frame of
                        the video.No larger than 10MB, and each side must be
                        greater than 300 pixels.
                    image_tail_url:
                      type: string
                      description: >-
                        End frame of the video. No larger than 10MB, and each
                        side must be greater than 300 pixels.Need to be used
                        with `image_url`.
                    origin_task_id:
                      type: string
                      description: 'The task_id of the video to extend or lip_sync. '
                    tts_text:
                      type: string
                      description: >-
                        The text that you want to lipsync in the video, used in
                        `lip_sync` task only; will be ignored if
                        `local_dubbing_url` is set
                    tts_speed:
                      type: number
                      description: >-
                        The speed of the lip_sync speech, used in `lip_sync`
                        task with valid `tts_text`only. 
                      default: 1
                      minimum: 0.8
                      maximum: 2
                    tts_timbre:
                      type: string
                      description: >-
                        The voice that you want to use in `lip_sync` task with
                        valid `ttx_text`, the full voice name list and demo list
                        here: https://klingai.com/api/lip/sync/ttsList?type=
                    local_dubbing_url:
                      type: string
                      format: uri
                      examples:
                        - https://example.com/hello.mp3
                      description: >-
                        Use your audio file for lip_sync through this parameter.
                        All tts related param will be ignored if this is set.
                        Audio format:`mp3``wav``flac``ogg`, should be less than
                        20 MB and shorter than 60 seconds. After the audio is
                        submitted, we will trim it to the exact length of the
                        original video. 
                    motion_brush:
                      properties:
                        mask_url:
                          type: string
                          format: uri
                          description: >-
                            the mask image contains all mask areas, image should
                            be exact same pixel size with the `image_url`. mask
                            image can only be png with all pixcel's alpha
                            channel set to zero. For more details please check
                            our motion brush doc 
                        static_masks:
                          type: array
                          items: &ref_0
                            $ref: '#/components/schemas/Control%20Points'
                          description: >-
                            you should always leave static mask to [{"points":
                            []}]
                        dynamic_masks:
                          type: array
                          items: *ref_0
                      x-apidog-orders:
                        - mask_url
                        - static_masks
                        - dynamic_masks
                      description: >-
                        It's highly recommended that you read our example doc
                        before acutally use motion brush
                      $ref: '#/components/schemas/motion%20brush'
                    effect:
                      type: string
                      enum:
                        - squish
                        - expansion
                      x-apidog-enum:
                        - value: squish
                          name: ''
                          description: ''
                        - value: expansion
                          name: ''
                          description: ''
                      description: >-
                        your choice of kling effect, see [Kling
                        Effects](/docs/kling-api/kling-effects)
                  x-apidog-orders:
                    - prompt
                    - negative_prompt
                    - cfg_scale
                    - duration
                    - aspect_ratio
                    - camera_control
                    - mode
                    - version
                    - image_url
                    - image_tail_url
                    - origin_task_id
                    - tts_text
                    - tts_speed
                    - tts_timbre
                    - local_dubbing_url
                    - motion_brush
                    - effect
                  description: >
                    the input param of the kling task, depends on the
                    `task_type` .refer to the example for more details.
                  x-apidog-ignore-properties: []
                config:
                  type: object
                  properties:
                    webhook_config:
                      type: object
                      properties:
                        endpoint:
                          type: string
                        secret:
                          type: string
                      required:
                        - endpoint
                        - secret
                      x-apidog-orders:
                        - endpoint
                        - secret
                      x-apidog-ignore-properties: []
                    service_mode:
                      type: string
                      enum:
                        - public
                        - private
                      x-apidog-enum:
                        - value: public
                          name: ''
                          description: ''
                        - value: private
                          name: ''
                          description: ''
                      description: >-
                        This field allows for more flexible switching between
                        HYA and PAYG.

                        - `public`->`Pay As You Go(PAYG)`

                        - `private`->`Host Your Account(HYA)`
                  x-apidog-orders:
                    - webhook_config
                    - service_mode
                  x-apidog-ignore-properties: []
              required:
                - model
                - input
                - task_type
              x-apidog-orders:
                - model
                - task_type
                - input
                - config
              x-apidog-refs: {}
              x-apidog-ignore-properties: []
            example:
              model: kling
              task_type: video_generation
              input:
                prompt: White egrets fly over the vast paddy fields
                negative_prompt: ''
                cfg_scale: 0.5
                duration: 5
                aspect_ratio: '1:1'
                camera_control:
                  type: simple
                  config:
                    horizontal: 0
                    vertical: 0
                    pan: -10
                    tilt: 0
                    roll: 0
                    zoom: 0
                mode: std
              config:
                service_mode: ''
                webhook_config:
                  endpoint: ''
                  secret: ''
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  data:
                    type: object
                    properties:
                      task_id:
                        type: string
                      model:
                        type: string
                      task_type:
                        type: string
                      status:
                        type: string
                        enum:
                          - Completed
                          - Processing
                          - Pending
                          - Failed
                          - Staged
                        x-apidog-enum:
                          - value: Completed
                            name: ''
                            description: ''
                          - value: Processing
                            name: ''
                            description: >-
                              Means that your jobs is currently being processed.
                              Number of "processing" jobs counts as part of the
                              "concurrent jobs"
                          - value: Pending
                            name: ''
                            description: >-
                              Means that we recognizes the jobs you sent should
                              be processed by MJ/Luma/Suno/Kling/etc but right
                              now none of the  account is available to receive
                              further jobs. During peak loads there can be
                              longer wait time to get your jobs from "pending"
                              to "processing". If reducing waiting time is your
                              primary concern, then a combination of
                              Pay-as-you-go and Host-your-own-account option
                              might suit you better.Number of "pending" jobs
                              counts as part of the "concurrent jobs"
                          - value: Failed
                            name: ''
                            description: Task failed. Check the error message for detail.
                          - value: Staged
                            name: ''
                            description: >-
                              A stage only in Midjourney task . Means that you
                              have exceeded the number of your "concurrent jobs"
                              limit and your jobs are being queuedNumber of
                              "staged" jobs does not count as part of the
                              "concurrent jobs". Also, please note the maximum
                              number of jobs in the "staged" queue is 50. So if
                              your operational needs exceed the 50 jobs limit,
                              then please create your own queuing system logic. 
                        description: >-
                          Hover on the "Completed" option and you coult see the
                          explaintion of all status:
                          completed/processing/pending/failed/staged
                      input:
                        type: object
                        properties: {}
                        x-apidog-orders: []
                        x-apidog-ignore-properties: []
                      output:
                        type: object
                        properties: {}
                        x-apidog-orders: []
                        x-apidog-ignore-properties: []
                      meta:
                        type: object
                        properties:
                          created_at:
                            type: string
                            description: >-
                              The time when the task was submitted to us (staged
                              and/or pending)
                          started_at:
                            type: string
                            description: >-
                              The time when the task started processing. the
                              time from created_at to time of started_at is time
                              the job spent in the "staged“ stage and/or
                              the"pending" stage if there were any.
                          ended_at:
                            type: string
                            description: The time when the task finished processing.
                          usage:
                            type: object
                            properties:
                              type:
                                type: string
                              frozen:
                                type: number
                              consume:
                                type: number
                            x-apidog-orders:
                              - type
                              - frozen
                              - consume
                            required:
                              - type
                              - frozen
                              - consume
                            x-apidog-ignore-properties: []
                          is_using_private_pool:
                            type: boolean
                        x-apidog-orders:
                          - created_at
                          - started_at
                          - ended_at
                          - usage
                          - is_using_private_pool
                        required:
                          - usage
                          - is_using_private_pool
                        x-apidog-ignore-properties: []
                      detail:
                        type: 'null'
                      logs:
                        type: array
                        items:
                          type: object
                          properties: {}
                          x-apidog-orders: []
                          x-apidog-ignore-properties: []
                      error:
                        type: object
                        properties:
                          code:
                            type: integer
                          message:
                            type: string
                        x-apidog-orders:
                          - code
                          - message
                        x-apidog-ignore-properties: []
                    x-apidog-orders:
                      - task_id
                      - model
                      - task_type
                      - status
                      - input
                      - output
                      - meta
                      - detail
                      - logs
                      - error
                    required:
                      - task_id
                      - model
                      - task_type
                      - status
                      - input
                      - output
                      - meta
                      - detail
                      - logs
                      - error
                    x-apidog-ignore-properties: []
                  message:
                    type: string
                    description: >-
                      If you get non-null error message, here are some steps you
                      chould follow:

                      - Check our [common error
                      message](https://climbing-adapter-afb.notion.site/Common-Error-Messages-6d108f5a8f644238b05ca50d47bbb0f4)

                      - Retry for several times

                      - If you have retried for more than 3 times and still not
                      work, file a ticket on Discord and our support will be
                      with you soon.
                x-apidog-orders:
                  - 01J8H15CWF1N733KB4AZE2S88M
                x-apidog-refs:
                  01J8H15CWF1N733KB4AZE2S88M:
                    $ref: '#/components/schemas/Unified-Task-Response'
                    x-apidog-overrides: {}
                    required:
                      - message
                required:
                  - code
                  - data
                  - message
                x-apidog-ignore-properties:
                  - code
                  - data
                  - message
              example: |-
                {
                    "code": 200,
                    "data": {
                        "task_id": "6e269e8c-2091-46c4-b4a5-40a4704a766a",
                        "model": "kling",
                        "task_type": "video_generation",
                        "status": "",// pending/processing/failed/completed
                        "config": {
                            "service_mode": "public",
                            "webhook_config": {
                                "endpoint": "",
                                "secret": ""
                            }
                        },
                        "input": {},
                        "output": {
                            "video_url": ""
                        },
                        "meta": {},
                        "detail": null,
                        "logs": [],
                        "error": {
                            "code": 0,
                            "raw_message": "",
                            "message": "",
                            "detail": null
                        }
                    },
                    "message": "success"
                }
          headers: {}
          x-apidog-name: Success
      security: []
      x-apidog-folder: Endpoints/Kling
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/675356/apis/api-10387106-run
components:
  schemas:
    Control Points:
      type: object
      properties:
        points:
          type: array
          items:
            type: object
            properties:
              x:
                type: number
                description: >-
                  positive value stands for right direction, and left_top of the
                  image is (0,0)
              'y':
                type: number
                description: >-
                  positive value stands for down direction, and left_top of the
                  image is (0,0)
            x-apidog-orders:
              - 01JBK5DAM8QAPATGHHWHYVMH9J
            required:
              - x
              - 'y'
            x-apidog-refs:
              01JBK5DAM8QAPATGHHWHYVMH9J:
                $ref: '#/components/schemas/Float2%20Point'
            x-apidog-ignore-properties:
              - x
              - 'y'
          description: a series of bazier curve control point
      x-apidog-orders:
        - points
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
    Float2 Point:
      type: object
      properties:
        x:
          type: number
          description: >-
            positive value stands for right direction, and left_top of the image
            is (0,0)
        'y':
          type: number
          description: >-
            positive value stands for down direction, and left_top of the image
            is (0,0)
      x-apidog-orders:
        - x
        - 'y'
      required:
        - x
        - 'y'
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
    motion brush:
      type: object
      properties:
        mask_url:
          type: string
          format: uri
          description: >-
            the mask image contains all mask areas, image should be exact same
            pixel size with the `image_url`. mask image can only be png with all
            pixcel's alpha channel set to zero. For more details please check
            our motion brush doc 
        static_masks:
          type: array
          items: *ref_0
          description: 'you should always leave static mask to [{"points": []}]'
        dynamic_masks:
          type: array
          items: *ref_0
      x-apidog-orders:
        - mask_url
        - static_masks
        - dynamic_masks
      description: >-
        It's highly recommended that you read our example doc before acutally
        use motion brush
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
    Unified-Task-Response:
      type: object
      properties:
        code:
          type: integer
        data:
          type: object
          properties:
            task_id:
              type: string
            model:
              type: string
            task_type:
              type: string
            status:
              type: string
              enum:
                - Completed
                - Processing
                - Pending
                - Failed
                - Staged
              x-apidog-enum:
                - value: Completed
                  name: ''
                  description: ''
                - value: Processing
                  name: ''
                  description: >-
                    Means that your jobs is currently being processed. Number of
                    "processing" jobs counts as part of the "concurrent jobs"
                - value: Pending
                  name: ''
                  description: >-
                    Means that we recognizes the jobs you sent should be
                    processed by MJ/Luma/Suno/Kling/etc but right now none of
                    the  account is available to receive further jobs. During
                    peak loads there can be longer wait time to get your jobs
                    from "pending" to "processing". If reducing waiting time is
                    your primary concern, then a combination of Pay-as-you-go
                    and Host-your-own-account option might suit you
                    better.Number of "pending" jobs counts as part of the
                    "concurrent jobs"
                - value: Failed
                  name: ''
                  description: Task failed. Check the error message for detail.
                - value: Staged
                  name: ''
                  description: >-
                    A stage only in Midjourney task . Means that you have
                    exceeded the number of your "concurrent jobs" limit and your
                    jobs are being queuedNumber of "staged" jobs does not count
                    as part of the "concurrent jobs". Also, please note the
                    maximum number of jobs in the "staged" queue is 50. So if
                    your operational needs exceed the 50 jobs limit, then please
                    create your own queuing system logic. 
              description: >-
                Hover on the "Completed" option and you coult see the
                explaintion of all status:
                completed/processing/pending/failed/staged
            input:
              type: object
              properties: {}
              x-apidog-orders: []
              x-apidog-ignore-properties: []
            output:
              type: object
              properties: {}
              x-apidog-orders: []
              x-apidog-ignore-properties: []
            meta:
              type: object
              properties:
                created_at:
                  type: string
                  description: >-
                    The time when the task was submitted to us (staged and/or
                    pending)
                started_at:
                  type: string
                  description: >-
                    The time when the task started processing. the time from
                    created_at to time of started_at is time the job spent in
                    the "staged“ stage and/or the"pending" stage if there were
                    any.
                ended_at:
                  type: string
                  description: The time when the task finished processing.
                usage:
                  type: object
                  properties:
                    type:
                      type: string
                    frozen:
                      type: number
                    consume:
                      type: number
                  x-apidog-orders:
                    - type
                    - frozen
                    - consume
                  required:
                    - type
                    - frozen
                    - consume
                  x-apidog-ignore-properties: []
                is_using_private_pool:
                  type: boolean
              x-apidog-orders:
                - created_at
                - started_at
                - ended_at
                - usage
                - is_using_private_pool
              required:
                - usage
                - is_using_private_pool
              x-apidog-ignore-properties: []
            detail:
              type: 'null'
            logs:
              type: array
              items:
                type: object
                properties: {}
                x-apidog-orders: []
                x-apidog-ignore-properties: []
            error:
              type: object
              properties:
                code:
                  type: integer
                message:
                  type: string
              x-apidog-orders:
                - code
                - message
              x-apidog-ignore-properties: []
          x-apidog-orders:
            - task_id
            - model
            - task_type
            - status
            - input
            - output
            - meta
            - detail
            - logs
            - error
          required:
            - task_id
            - model
            - task_type
            - status
            - input
            - output
            - meta
            - detail
            - logs
            - error
          x-apidog-ignore-properties: []
        message:
          type: string
          description: >-
            If you get non-null error message, here are some steps you chould
            follow:

            - Check our [common error
            message](https://climbing-adapter-afb.notion.site/Common-Error-Messages-6d108f5a8f644238b05ca50d47bbb0f4)

            - Retry for several times

            - If you have retried for more than 3 times and still not work, file
            a ticket on Discord and our support will be with you soon.
      x-examples:
        Example 1:
          code: 200
          data:
            task_id: 49638cd2-4689-4f33-9336-164a8f6b1111
            model: Qubico/flux1-dev
            task_type: txt2img
            status: pending
            input:
              prompt: a bear
            output: null
            meta:
              account_id: 0
              account_name: Qubico_test_user
              created_at: '2024-08-16T16:13:21.194049Z'
              started_at: ''
              completed_at: ''
            detail: null
            logs: []
            error:
              code: 0
              message: ''
          message: success
      x-apidog-orders:
        - code
        - data
        - message
      required:
        - code
        - data
        - message
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
  securitySchemes: {}
servers:
  - url: https://api.piapi.ai
    description: Develop Env
security: []

```

# Get Task

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/v1/task/{task_id}:
    get:
      summary: Get Task
      deprecated: false
      description: >-
        This is provided as part of the [Kling API](https://piapi.ai/kling-api)
        from PiAPI. 

        This endpoint could get video generation progress or result of Kling
        task.
      operationId: kling-api/get-task
      tags:
        - Endpoints/Kling
      parameters:
        - name: task_id
          in: path
          description: ''
          required: true
          schema:
            type: string
        - name: x-api-key
          in: header
          description: Your API Key used for request authorization
          required: true
          example: ''
          schema:
            type: string
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  data:
                    type: object
                    properties:
                      task_id:
                        type: string
                      model:
                        type: string
                      task_type:
                        type: string
                      status:
                        type: string
                        enum:
                          - Completed
                          - Processing
                          - Pending
                          - Failed
                          - Staged
                        x-apidog-enum:
                          - value: Completed
                            name: ''
                            description: ''
                          - value: Processing
                            name: ''
                            description: >-
                              Means that your jobs is currently being processed.
                              Number of "processing" jobs counts as part of the
                              "concurrent jobs"
                          - value: Pending
                            name: ''
                            description: >-
                              Means that we recognizes the jobs you sent should
                              be processed by MJ/Luma/Suno/Kling/etc but right
                              now none of the  account is available to receive
                              further jobs. During peak loads there can be
                              longer wait time to get your jobs from "pending"
                              to "processing". If reducing waiting time is your
                              primary concern, then a combination of
                              Pay-as-you-go and Host-your-own-account option
                              might suit you better.Number of "pending" jobs
                              counts as part of the "concurrent jobs"
                          - value: Failed
                            name: ''
                            description: Task failed. Check the error message for detail.
                          - value: Staged
                            name: ''
                            description: >-
                              A stage only in Midjourney task . Means that you
                              have exceeded the number of your "concurrent jobs"
                              limit and your jobs are being queuedNumber of
                              "staged" jobs does not count as part of the
                              "concurrent jobs". Also, please note the maximum
                              number of jobs in the "staged" queue is 50. So if
                              your operational needs exceed the 50 jobs limit,
                              then please create your own queuing system logic. 
                        description: >-
                          Hover on the "Completed" option and you coult see the
                          explaintion of all status:
                          completed/processing/pending/failed/staged
                      input:
                        type: object
                        properties: {}
                        x-apidog-orders: []
                        x-apidog-ignore-properties: []
                      output:
                        type: object
                        properties: {}
                        x-apidog-orders: []
                        x-apidog-ignore-properties: []
                      meta:
                        type: object
                        properties:
                          created_at:
                            type: string
                            description: >-
                              The time when the task was submitted to us (staged
                              and/or pending)
                          started_at:
                            type: string
                            description: >-
                              The time when the task started processing. the
                              time from created_at to time of started_at is time
                              the job spent in the "staged“ stage and/or
                              the"pending" stage if there were any.
                          ended_at:
                            type: string
                            description: The time when the task finished processing.
                          usage:
                            type: object
                            properties:
                              type:
                                type: string
                              frozen:
                                type: number
                              consume:
                                type: number
                            x-apidog-orders:
                              - type
                              - frozen
                              - consume
                            required:
                              - type
                              - frozen
                              - consume
                            x-apidog-ignore-properties: []
                          is_using_private_pool:
                            type: boolean
                        x-apidog-orders:
                          - created_at
                          - started_at
                          - ended_at
                          - usage
                          - is_using_private_pool
                        required:
                          - usage
                          - is_using_private_pool
                        x-apidog-ignore-properties: []
                      detail:
                        type: 'null'
                      logs:
                        type: array
                        items:
                          type: object
                          properties: {}
                          x-apidog-orders: []
                          x-apidog-ignore-properties: []
                      error:
                        type: object
                        properties:
                          code:
                            type: integer
                          message:
                            type: string
                        x-apidog-orders:
                          - code
                          - message
                        x-apidog-ignore-properties: []
                    x-apidog-orders:
                      - task_id
                      - model
                      - task_type
                      - status
                      - input
                      - output
                      - meta
                      - detail
                      - logs
                      - error
                    required:
                      - task_id
                      - model
                      - task_type
                      - status
                      - input
                      - output
                      - meta
                      - detail
                      - logs
                      - error
                    x-apidog-ignore-properties: []
                  message:
                    type: string
                    description: >-
                      If you get non-null error message, here are some steps you
                      chould follow:

                      - Check our [common error
                      message](https://climbing-adapter-afb.notion.site/Common-Error-Messages-6d108f5a8f644238b05ca50d47bbb0f4)

                      - Retry for several times

                      - If you have retried for more than 3 times and still not
                      work, file a ticket on Discord and our support will be
                      with you soon.
                x-apidog-orders:
                  - 01J8MXKN2C0FPCAMTSG8FV1PZ8
                required:
                  - code
                  - data
                  - message
                x-apidog-refs:
                  01J8MXKN2C0FPCAMTSG8FV1PZ8:
                    $ref: '#/components/schemas/Unified-Task-Response'
                x-apidog-ignore-properties:
                  - code
                  - data
                  - message
              example:
                code: 200
                data:
                  task_id: b3efc0ab-3fdb-4b88-b20a-94eef777e125
                  model: kling
                  task_type: video_generation
                  status: completed
                  config:
                    service_mode: private
                    webhook_config:
                      endpoint: ''
                      secret: ''
                  input: {}
                  output:
                    type: m2v_txt2video_hq
                    status: 99
                    works:
                      - status: 99
                        type: m2v_txt2video_hq
                        cover:
                          resource: https://xxx.png
                          resource_without_watermark: ''
                          height: 1440
                          width: 1440
                          duration: 0
                        video:
                          resource: https://xxx.mp4
                          resource_without_watermark: https://storage.goapi.ai/xxx.mp4
                          height: 1440
                          width: 1440
                          duration: 5100
                  meta: {}
                  detail: null
                  logs: []
                  error:
                    code: 0
                    raw_message: ''
                    message: ''
                    detail: null
                message: success
          headers: {}
          x-apidog-name: Success
      security: []
      x-apidog-folder: Endpoints/Kling
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/675356/apis/api-10275890-run
components:
  schemas:
    Unified-Task-Response:
      type: object
      properties:
        code:
          type: integer
        data:
          type: object
          properties:
            task_id:
              type: string
            model:
              type: string
            task_type:
              type: string
            status:
              type: string
              enum:
                - Completed
                - Processing
                - Pending
                - Failed
                - Staged
              x-apidog-enum:
                - value: Completed
                  name: ''
                  description: ''
                - value: Processing
                  name: ''
                  description: >-
                    Means that your jobs is currently being processed. Number of
                    "processing" jobs counts as part of the "concurrent jobs"
                - value: Pending
                  name: ''
                  description: >-
                    Means that we recognizes the jobs you sent should be
                    processed by MJ/Luma/Suno/Kling/etc but right now none of
                    the  account is available to receive further jobs. During
                    peak loads there can be longer wait time to get your jobs
                    from "pending" to "processing". If reducing waiting time is
                    your primary concern, then a combination of Pay-as-you-go
                    and Host-your-own-account option might suit you
                    better.Number of "pending" jobs counts as part of the
                    "concurrent jobs"
                - value: Failed
                  name: ''
                  description: Task failed. Check the error message for detail.
                - value: Staged
                  name: ''
                  description: >-
                    A stage only in Midjourney task . Means that you have
                    exceeded the number of your "concurrent jobs" limit and your
                    jobs are being queuedNumber of "staged" jobs does not count
                    as part of the "concurrent jobs". Also, please note the
                    maximum number of jobs in the "staged" queue is 50. So if
                    your operational needs exceed the 50 jobs limit, then please
                    create your own queuing system logic. 
              description: >-
                Hover on the "Completed" option and you coult see the
                explaintion of all status:
                completed/processing/pending/failed/staged
            input:
              type: object
              properties: {}
              x-apidog-orders: []
              x-apidog-ignore-properties: []
            output:
              type: object
              properties: {}
              x-apidog-orders: []
              x-apidog-ignore-properties: []
            meta:
              type: object
              properties:
                created_at:
                  type: string
                  description: >-
                    The time when the task was submitted to us (staged and/or
                    pending)
                started_at:
                  type: string
                  description: >-
                    The time when the task started processing. the time from
                    created_at to time of started_at is time the job spent in
                    the "staged“ stage and/or the"pending" stage if there were
                    any.
                ended_at:
                  type: string
                  description: The time when the task finished processing.
                usage:
                  type: object
                  properties:
                    type:
                      type: string
                    frozen:
                      type: number
                    consume:
                      type: number
                  x-apidog-orders:
                    - type
                    - frozen
                    - consume
                  required:
                    - type
                    - frozen
                    - consume
                  x-apidog-ignore-properties: []
                is_using_private_pool:
                  type: boolean
              x-apidog-orders:
                - created_at
                - started_at
                - ended_at
                - usage
                - is_using_private_pool
              required:
                - usage
                - is_using_private_pool
              x-apidog-ignore-properties: []
            detail:
              type: 'null'
            logs:
              type: array
              items:
                type: object
                properties: {}
                x-apidog-orders: []
                x-apidog-ignore-properties: []
            error:
              type: object
              properties:
                code:
                  type: integer
                message:
                  type: string
              x-apidog-orders:
                - code
                - message
              x-apidog-ignore-properties: []
          x-apidog-orders:
            - task_id
            - model
            - task_type
            - status
            - input
            - output
            - meta
            - detail
            - logs
            - error
          required:
            - task_id
            - model
            - task_type
            - status
            - input
            - output
            - meta
            - detail
            - logs
            - error
          x-apidog-ignore-properties: []
        message:
          type: string
          description: >-
            If you get non-null error message, here are some steps you chould
            follow:

            - Check our [common error
            message](https://climbing-adapter-afb.notion.site/Common-Error-Messages-6d108f5a8f644238b05ca50d47bbb0f4)

            - Retry for several times

            - If you have retried for more than 3 times and still not work, file
            a ticket on Discord and our support will be with you soon.
      x-examples:
        Example 1:
          code: 200
          data:
            task_id: 49638cd2-4689-4f33-9336-164a8f6b1111
            model: Qubico/flux1-dev
            task_type: txt2img
            status: pending
            input:
              prompt: a bear
            output: null
            meta:
              account_id: 0
              account_name: Qubico_test_user
              created_at: '2024-08-16T16:13:21.194049Z'
              started_at: ''
              completed_at: ''
            detail: null
            logs: []
            error:
              code: 0
              message: ''
          message: success
      x-apidog-orders:
        - code
        - data
        - message
      required:
        - code
        - data
        - message
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
  securitySchemes: {}
servers:
  - url: https://api.piapi.ai
    description: Develop Env
security: []

```