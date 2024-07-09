import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
    const { email, fullName, userName, password } = req.body;
    console.log("email: ", email);

    if (
        [email, fullName, userName, password].some(
            (fields) => fields?.trim === ""
        )
    ) {
        throw new apiError(400, "please fill all fields");
    }

    const userExist = User.findOne({
        $or: [{ userName }, { email }],
    });

    if (userExist) {
        throw new apiError(409, "user already exist");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "requre avatar image");
    }
    const cloudinaryAvatar = await uploadOnCloudinary(avatarLocalPath);
    const cloudinaryCoverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!cloudinaryAvatar) {
        throw new apiError(400, "requre avatar image");
    }

    const user = await User.create({
        fullName,
        avatar: cloudinaryAvatar.url,
        coverImage: cloudinaryCoverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase(),
    });

    const isUserCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!isUserCreated) {
        throw new apiError(500, "something went wrong while creating the user");
    }

    return res
        .status(201)
        .json(
            new apiResponse(200, isUserCreated, "user is created succesfully")
        );
});

export { registerUser };
